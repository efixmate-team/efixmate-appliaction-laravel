<?php

namespace App\Http\Controllers;

use App\Services\TechnicianRegistrationService;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianBankDetail;
use Efixmate\Domain\Models\TechnicianDocument;
use Efixmate\Domain\Models\MapTechnicianService;
use Illuminate\Http\Request;

/** Direct port of profile/update-profile/update-bank in server/.../technician.controller.js. */
class TechnicianProfileController extends Controller
{
    public function __construct(private TechnicianRegistrationService $svc) {}

    /** GET /api/technician/profile */
    public function show(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $technician = Technician::find($technicianId);
        abort_if(! $technician, 404, 'Technician not found!');

        $appState = $this->svc->applicationState($technician);
        if (! $this->svc->isRegistered($technician)) {
            return response()->json(array_merge(['status' => false, 'is_registered' => false], $appState, [
                'message' => match ($appState['application_status']) {
                    'pending' => 'Your application is pending admin approval',
                    'rejected' => 'Your application was rejected. Complete registration to resubmit',
                    default => 'Complete registration before accessing your profile',
                },
            ]), 403);
        }

        $documents = TechnicianDocument::where('efm_technician_documents.technician_id', $technicianId)
            ->where('efm_technician_documents.is_active', true)
            ->join('efm_lkp_document_type as dt', 'dt.document_type_id', '=', 'efm_technician_documents.document_type_id')
            ->select('efm_technician_documents.*', 'dt.document_type as document_type_name')
            ->get();
        $bankDetails = TechnicianBankDetail::where('technician_id', $technicianId)->where('is_active', true)->first();
        $services = MapTechnicianService::where('technician_id', $technicianId)->where('is_active', true)->get();
        $location = $this->svc->getActiveLocation($technicianId);

        return response()->json(array_merge(['status' => true, 'message' => 'Technician data fetched successfully!', 'is_registered' => true], $appState, [
            'data' => [
                'profile' => array_merge([
                    'id' => $technician->technician_id, 'technicianUniqueId' => $technician->technician_unique_id,
                    'firstName' => $technician->first_name, 'lastName' => $technician->last_name, 'mobileNumber' => $technician->mobile_number,
                    'profilePitcher' => PublicUrlResolver::resolve($request, $technician->profile_pitcher),
                    'selfiePhoto' => PublicUrlResolver::resolve($request, $technician->selfie_photo),
                    'categoryId' => $technician->category_id, 'serviceId' => $technician->sub_category_id, 'subCategoryId' => $technician->sub_category_id,
                    'city' => $location?->city, 'state' => $location?->state, 'country' => $location?->country,
                    'address' => $location?->address, 'pincode' => $location?->pincode, 'latitude' => $location?->latitude, 'longitude' => $location?->longitude,
                    'isActive' => $technician->is_active, 'is_registered' => true,
                ], $appState),
                'documents' => $documents, 'bankDetails' => $bankDetails, 'services' => $services,
            ],
        ]));
    }

    /** POST /api/technician/update-profile */
    public function update(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $body = $request->all();

        Technician::where('technician_id', $technicianId)->update(array_filter([
            'first_name' => $body['first_name'] ?? $body['firstName'] ?? null,
            'last_name' => $body['last_name'] ?? $body['lastName'] ?? null,
            'profile_pitcher' => $body['profile_pitcher'] ?? $body['profilePitcher'] ?? null,
            'category_id' => $body['category_id'] ?? $body['categoryId'] ?? null,
            'sub_category_id' => $body['serviceId'] ?? $body['service_id'] ?? $body['subCategoryId'] ?? $body['sub_category_id'] ?? null,
            'updated_by' => 'technician', 'updated_at' => now(),
        ], fn ($v) => $v !== null));

        $location = null;
        if (! empty($body['address']) || ! empty($body['city']) || ! empty($body['country']) || ! empty($body['pincode'])) {
            abort_if(empty($body['address']) || empty($body['city']) || empty($body['country']) || empty($body['pincode']), 400, 'address, city, country, and pincode are required when updating location');
            $location = $this->svc->upsertLocation($technicianId, $body, 'technician');
        }

        return response()->json(['status' => true, 'message' => 'Profile updated successfully', 'data' => array_merge(Technician::find($technicianId)->toArray(), ['location' => $location])]);
    }

    /** POST /api/technician/update-bank */
    public function updateBank(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $holder = $request->input('accountHolderName');
        $number = $request->input('accountNumber');
        $ifsc = $request->input('ifscNumber');
        abort_if(! $holder || ! $number || ! $ifsc, 400, 'Required bank fields missing');

        $payload = ['acount_holder_name' => $holder, 'account_number' => $number, 'ifsc_number' => $ifsc, 'account_type' => $request->input('accountType', 'C'), 'updated_by' => 'technician'];

        $existing = TechnicianBankDetail::where('technician_id', $technicianId)->where('is_active', true)->first();
        if ($existing) {
            $existing->update(array_merge($payload, ['is_verified' => false, 'updated_at' => now()]));
            $bank = $existing->fresh();
        } else {
            $bank = TechnicianBankDetail::create(array_merge($payload, ['technician_id' => $technicianId, 'status_id' => 1, 'is_verified' => false, 'is_active' => true, 'created_by' => 'system', 'created_at' => now()]));
        }

        return response()->json(['status' => true, 'message' => 'Bank details updated successfully', 'data' => $bank]);
    }

    /** POST /api/technician/auth/logout-all */
    public function logoutAll(Request $request)
    {
        Technician::where('technician_id', $request->user()->technician_id)->update(['fcm_token' => null, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Logged out successfully']);
    }

    /** GET /api/technician/referral */
    public function referral(Request $request, \App\Services\ReferralService $referrals)
    {
        $technicianId = $request->user()->technician_id;
        $code = $referrals->getOrCreateCode($technicianId, 'TECHNICIAN');
        $config = $referrals->getConfig();
        $stats = $referrals->getStats($technicianId, 'TECHNICIAN');

        return response()->json(['status' => true, 'data' => [
            'referral_code' => $code,
            'config' => ['enabled' => $config['tech_enabled'], 'referrer_reward' => $config['tech_referrer_reward'], 'referred_reward' => $config['tech_referred_reward'], 'trigger' => $config['trigger']],
            'stats' => $stats,
        ]]);
    }

    /** POST /api/technician/referral/apply */
    public function applyReferral(Request $request, \App\Services\ReferralService $referrals)
    {
        $data = $request->validate(['referral_code' => ['required', 'string']]);
        $technicianId = $request->user()->technician_id;

        $result = $referrals->applyCode($data['referral_code'], $technicianId, 'TECHNICIAN', $request->ip());
        abort_if(isset($result['error']), 400, $result['error'] ?? 'Unable to apply referral code');

        return response()->json(['status' => true, 'message' => 'Referral code applied!', 'data' => $result]);
    }
}
