<?php

namespace App\Services;

use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianBankDetail;
use Efixmate\Domain\Models\TechnicianDocument;
use Efixmate\Domain\Models\TechnicianLocation;
use Efixmate\Domain\Models\TechnicianSectionReview;
use Efixmate\Domain\Models\MapTechnicianService;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of the shared helpers threaded through
 * server/src/modules/technician/controller/technician.controller.js:
 * technicianIsRegistered, applicationStateForClient, loadTechnicianForRegistration,
 * buildRegistrationProgress, upsertTechnicianLocation, getActiveTechnicianLocation,
 * splitFullName, pickOptionalCoordinates.
 */
class TechnicianRegistrationService
{
    public function isRegistered(Technician $t): bool
    {
        return (bool) $t->is_active && $t->application_status === 'approved';
    }

    /** @return array{application_status: string, application_reject_reason: ?string, can_retry_application: bool, is_pending_review: bool} */
    public function applicationState(Technician $t): array
    {
        $status = $this->isRegistered($t)
            ? 'approved'
            : (in_array($t->application_status, ['pending', 'rejected', 'approved'], true) ? strtolower($t->application_status) : 'draft');

        return [
            'application_status' => $status,
            'application_reject_reason' => $status === 'rejected' ? $t->application_reject_reason : null,
            'can_retry_application' => $status === 'rejected',
            'is_pending_review' => $status === 'pending',
        ];
    }

    /**
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function loadForRegistration(int $technicianId): Technician
    {
        $technician = Technician::find($technicianId);
        abort_if(! $technician, 404, 'Technician not found');
        abort_if($this->isRegistered($technician), 400, 'Account is already registered');

        if (strtolower((string) $technician->application_status) === 'pending') {
            $hasRejectedSection = TechnicianSectionReview::where('technician_id', $technicianId)->where('status', 'rejected')->exists();
            abort_if(! $hasRejectedSection, 400, 'Application is pending admin review');
        }

        return $technician;
    }

    public function splitFullName(?string $fullName): array
    {
        $parts = preg_split('/\s+/', trim((string) $fullName), -1, PREG_SPLIT_NO_EMPTY);
        if (empty($parts)) {
            return ['first_name' => null, 'last_name' => null];
        }
        if (count($parts) === 1) {
            return ['first_name' => $parts[0], 'last_name' => null];
        }

        return ['first_name' => $parts[0], 'last_name' => implode(' ', array_slice($parts, 1))];
    }

    /** @return array{0: ?float, 1: ?float} [lat, lng] */
    public function pickOptionalCoordinates(array $body): array
    {
        $lat = $body['latitude'] ?? $body['lat'] ?? null;
        $lng = $body['longitude'] ?? $body['lng'] ?? $body['lon'] ?? null;
        $lat = is_numeric($lat) ? (float) $lat : null;
        $lng = is_numeric($lng) ? (float) $lng : null;

        return [$lat, $lng];
    }

    public function getActiveLocation(int $technicianId): ?TechnicianLocation
    {
        return TechnicianLocation::where('technician_id', $technicianId)
            ->where(function ($q) { $q->where('is_active', true)->orWhereNull('is_active'); })
            ->orderByDesc('location_id')->first();
    }

    public function upsertLocation(int $technicianId, array $body, string $updatedBy): TechnicianLocation
    {
        [$lat, $lng] = $this->pickOptionalCoordinates($body);
        $pincode = isset($body['pincode']) ? (int) $body['pincode'] : null;

        $existing = TechnicianLocation::where('technician_id', $technicianId)->where('is_active', true)->orderByDesc('location_id')->first();

        if ($existing) {
            $existing->update([
                'city' => $body['city'] ?? $existing->city,
                'state' => $body['state'] ?? $existing->state,
                'country' => $body['country'] ?? $existing->country,
                'address' => $body['address'] ?? $existing->address,
                'pincode' => $pincode ?? $existing->pincode,
                'latitude' => $lat !== null ? (string) $lat : $existing->latitude,
                'longitude' => $lng !== null ? (string) $lng : $existing->longitude,
                'updated_by' => $updatedBy,
                'updated_at' => now(),
            ]);

            return $existing->fresh();
        }

        return TechnicianLocation::create([
            'technician_id' => $technicianId,
            'city' => $body['city'] ?? '',
            // efm_technician_location.state is NOT NULL even though the
            // basic-details registration step doesn't collect it — Node's own
            // insert must supply '' here for the same reason (state is only
            // required later, in the post-approval /home/address upsert).
            'state' => $body['state'] ?? '',
            'country' => $body['country'] ?? '',
            'address' => $body['address'] ?? '',
            'pincode' => $pincode,
            'latitude' => $lat !== null ? (string) $lat : null,
            'longitude' => $lng !== null ? (string) $lng : null,
            'status_id' => 1,
            'is_active' => true,
            'created_by' => $updatedBy,
            'created_at' => now(),
        ]);
    }

    private function appliesToTechnicianClause(): string
    {
        return "CONCAT(',', REPLACE(UPPER(TRIM(applies_to)), ' ', ''), ',') LIKE '%,TECHNICIAN,%'";
    }

    /** @return array{basic_details: array, skills: array, documents: array, selfie: array, bank_details: array, can_submit: bool} */
    public function buildProgress(int $technicianId): array
    {
        $technician = Technician::findOrFail($technicianId);
        $location = $this->getActiveLocation($technicianId);

        $basicMissing = [];
        if (! $technician->first_name || $technician->first_name === 'Technician') {
            $basicMissing[] = 'fullName';
        }
        if (! $technician->last_name || $technician->last_name === 'User') {
            $basicMissing[] = 'fullName';
        }
        if (! $technician->email) {
            $basicMissing[] = 'email';
        }
        foreach (['address', 'city', 'country', 'pincode', 'latitude', 'longitude'] as $field) {
            if (! $location || ! $location->{$field}) {
                $basicMissing[] = $field;
            }
        }

        $services = MapTechnicianService::where('technician_id', $technicianId)->where('is_active', true)->get();

        $docRows = DB::table('efm_lkp_document_type as dt')
            ->leftJoin('efm_technician_documents as td', function ($j) use ($technicianId) {
                $j->on('td.document_type_id', '=', 'dt.document_type_id')->where('td.technician_id', $technicianId)->where('td.is_active', true);
            })
            ->where('dt.is_active', true)
            ->whereRaw($this->appliesToTechnicianClause())
            ->whereRaw('LOWER(dt.document_type) NOT LIKE ?', ['%selfie%'])
            ->orderBy('dt.order_seq')->orderBy('dt.document_type_id')
            ->select('dt.document_type_id', 'dt.document_type', 'dt.is_mandatory', 'td.document_number', 'td.attachement as attachment')
            ->get();

        $missingDocs = $docRows->filter(fn ($r) => $r->is_mandatory && (! $r->attachment || ! $r->document_number))
            ->map(fn ($r) => ['document_type_id' => $r->document_type_id, 'document_type' => $r->document_type, 'is_mandatory' => (bool) $r->is_mandatory])
            ->values();

        $bank = TechnicianBankDetail::where('technician_id', $technicianId)->where('is_active', true)->first();
        $bankComplete = false;
        if ($bank && $bank->acount_holder_name) {
            $bankComplete = $bank->account_type === 'U'
                ? (bool) $bank->account_number
                : ((bool) $bank->account_number && $bank->ifsc_number && $bank->ifsc_number !== 'UPI');
        }

        $mandatoryCount = $docRows->where('is_mandatory', true)->count();
        $basicComplete = empty($basicMissing);
        $skillsComplete = $services->count() > 0;
        $documentsComplete = $mandatoryCount === 0 || $missingDocs->isEmpty();
        $selfieComplete = (bool) $technician->selfie_photo;

        return [
            'basic_details' => ['completed' => $basicComplete, 'missing' => $basicMissing],
            'skills' => ['completed' => $skillsComplete, 'selected_count' => $services->count()],
            'documents' => ['completed' => $documentsComplete, 'missing' => $missingDocs->values(), 'uploaded_count' => $docRows->filter(fn ($r) => $r->attachment)->count()],
            'selfie' => ['completed' => $selfieComplete],
            'bank_details' => ['completed' => $bankComplete],
            'can_submit' => $basicComplete && $skillsComplete && $documentsComplete && $selfieComplete && $bankComplete,
        ];
    }
}
