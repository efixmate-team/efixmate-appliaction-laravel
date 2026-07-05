<?php

namespace App\Http\Controllers;

use App\Services\FileUploadService;
use App\Services\Payment\PaymentGatewayRegistry;
use App\Services\TechnicianRegistrationService;
use Efixmate\Domain\Models\LkpDocumentType;
use Efixmate\Domain\Models\MapSkillsToService;
use Efixmate\Domain\Models\MapTechnicianService;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\MstrSkill;
use Efixmate\Domain\Models\PartnerAgreementAcceptanceLog;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianBankDetail;
use Efixmate\Domain\Models\TechnicianDocument;
use Efixmate\Domain\Models\TechnicianSectionReview;
use Efixmate\Domain\Support\UploadSlots;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of the registration-wizard slice of server/.../technician.controller.js. */
class TechnicianRegistrationController extends Controller
{
    public function __construct(
        private TechnicianRegistrationService $svc,
        private FileUploadService $uploads,
        private PaymentGatewayRegistry $gateways,
    ) {}

    private function appliesToTechnicianClause(): string
    {
        return "CONCAT(',', REPLACE(UPPER(TRIM(applies_to)), ' ', ''), ',') LIKE '%,TECHNICIAN,%'";
    }

    /** GET /api/technician/required-document-list — public. */
    public function requiredDocumentList()
    {
        $rows = LkpDocumentType::where('is_active', true)
            ->whereRaw($this->appliesToTechnicianClause())
            ->whereRaw('LOWER(document_type) NOT LIKE ?', ['%selfie%'])
            ->orderBy('order_seq')->orderBy('document_type_id')
            ->get(['document_type_id', 'document_type', 'order_seq', 'is_mandatory']);

        return response()->json(['status' => true, 'message' => 'Required documents fetched successfully', 'data' => $rows]);
    }

    /** GET /api/technician/registration/status */
    public function status(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $technician = Technician::find($technicianId);
        abort_if(! $technician, 404, 'Technician not found');

        $progress = $this->svc->buildProgress($technicianId);
        $appState = $this->svc->applicationState($technician);
        $isRegistered = $this->svc->isRegistered($technician);

        $sectionReviews = TechnicianSectionReview::where('technician_id', $technicianId)
            ->get(['section', 'status', 'remark', 'reviewed_at'])
            ->keyBy('section');

        $docSections = DB::table('efm_technician_documents as d')
            ->leftJoin('efm_lkp_document_type as t', 't.document_type_id', '=', 'd.document_type_id')
            ->where('d.technician_id', $technicianId)->where('d.is_active', true)
            ->select('d.document_id', 'd.document_type_id', 't.document_type')
            ->get()->map(function ($r) use ($sectionReviews) {
                $key = 'doc_'.$r->document_id;

                return ['document_id' => $r->document_id, 'document_type' => $r->document_type, 'section_key' => $key, 'review' => $sectionReviews->get($key)];
            });

        return response()->json(array_merge(['status' => true, 'message' => 'Registration status fetched', 'is_registered' => $isRegistered], $appState, [
            'registration_progress' => $progress, 'section_reviews' => $sectionReviews, 'document_sections' => $docSections,
        ]));
    }

    /** GET /api/technician/registration/services — legacy. */
    public function services(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $services = DB::table('efm_mstr_services as s')
            ->join('efm_mstr_service_category as c', 'c.category_id', '=', 's.category_id')
            ->where('s.is_active', true)->where('c.is_active', true)
            ->orderBy('c.order_seq')->orderBy('s.order_seq')
            ->select('s.service_id', 's.service', 's.category_id', 's.order_seq', 's.description', 's.service_icon', 's.service_color', 'c.category_name')
            ->get();

        $selected = MapTechnicianService::where('technician_id', $technicianId)->where('is_active', true)->pluck('service_id');

        return response()->json(['status' => true, 'message' => 'Services fetched successfully', 'data' => $services, 'selected_service_ids' => $selected]);
    }

    /** GET /api/technician/registration/skills */
    public function skillsList(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $skills = DB::table('efm_mstr_skills as s')
            ->join('efm_mstr_service_category as c', 'c.category_id', '=', 's.category_id')
            ->where('s.is_active', true)->where('c.is_active', true)
            ->orderBy('c.order_seq')->orderBy('s.order_seq')
            ->select('s.skill_id', 's.skill_name', 's.category_id', 'c.category_name', 's.description', 's.skill_icon', 's.skill_color', 's.order_seq')
            ->get();

        $selected = DB::table('efm_technician_skills')->where('technician_id', $technicianId)->pluck('skill_id');

        return response()->json(['status' => true, 'message' => 'Skills fetched successfully', 'data' => $skills, 'selected_skill_ids' => $selected]);
    }

    /** POST /api/technician/registration/basic-details */
    public function basicDetails(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $technician = $this->svc->loadForRegistration($technicianId);

        $body = $request->all();
        if (! empty($body['fullName']) || ! empty($body['full_name'])) {
            $split = $this->svc->splitFullName($body['fullName'] ?? $body['full_name']);
            $firstName = $split['first_name'];
            $lastName = $split['last_name'];
        } else {
            $firstName = $body['firstName'] ?? $body['first_name'] ?? null;
            $lastName = $body['lastName'] ?? $body['last_name'] ?? null;
        }
        abort_if(! $firstName, 400, 'Full name is required');

        $email = strtolower(trim((string) ($body['email'] ?? '')));
        abort_if(! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email), 400, 'Valid email is required');

        abort_if(empty($body['address']) || empty($body['city']) || empty($body['country']) || empty($body['pincode']), 400, 'address, city, country, and pincode are required');

        [$lat, $lng] = $this->svc->pickOptionalCoordinates($body);
        abort_if($lat === null || $lng === null, 400, 'Current location is required. Please choose your location on the map.');

        $technician->update(array_filter([
            'first_name' => $firstName, 'last_name' => $lastName, 'email' => $email,
            'category_id' => $body['categoryId'] ?? $body['category_id'] ?? null,
            'updated_by' => 'technician', 'updated_at' => now(),
        ], fn ($v) => $v !== null));

        $location = $this->svc->upsertLocation($technicianId, $body, 'technician');
        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'message' => 'Basic details saved', 'data' => array_merge($technician->fresh()->toArray(), ['location' => $location]), 'registration_progress' => $progress]);
    }

    /** POST /api/technician/registration/skills */
    public function saveSkills(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $skillIds = $request->input('skillIds') ?? $request->input('skill_ids');
        $serviceIds = $request->input('serviceIds') ?? $request->input('service_ids');

        if (is_array($skillIds) && count($skillIds) > 0) {
            $valid = MstrSkill::whereIn('skill_id', $skillIds)->where('is_active', true)->get(['skill_id', 'category_id']);
            abort_if($valid->count() !== count($skillIds), 400, 'One or more selected skills are invalid');

            DB::table('efm_technician_skills')->where('technician_id', $technicianId)->delete();
            foreach ($skillIds as $skillId) {
                DB::table('efm_technician_skills')->insertOrIgnore(['technician_id' => $technicianId, 'skill_id' => $skillId, 'skill_level' => 'standard']);
            }

            $derivedServices = DB::table('efm_map_skills_to_services as m')
                ->join('efm_mstr_services as sv', 'sv.service_id', '=', 'm.service_id')
                ->whereIn('m.skill_id', $skillIds)->where('sv.is_active', true)
                ->select('m.service_id', 'sv.category_id')->distinct()->get();

            MapTechnicianService::where('technician_id', $technicianId)->delete();
            foreach ($derivedServices as $svc) {
                MapTechnicianService::create(['technician_id' => $technicianId, 'service_id' => $svc->service_id, 'is_active' => true, 'created_by' => 'technician', 'created_at' => now()]);
            }

            $primaryCategoryId = $valid->first()?->category_id;
            if ($primaryCategoryId) {
                $firstService = $derivedServices->firstWhere('category_id', $primaryCategoryId);
                Technician::where('technician_id', $technicianId)->update(['category_id' => $primaryCategoryId, 'sub_category_id' => $firstService?->service_id, 'updated_by' => 'technician', 'updated_at' => now()]);
            }

            $progress = $this->svc->buildProgress($technicianId);

            return response()->json(['status' => true, 'message' => 'Skills saved successfully', 'data' => ['skill_ids' => $skillIds, 'service_count' => $derivedServices->count()], 'registration_progress' => $progress]);
        }

        abort_if(! is_array($serviceIds) || count($serviceIds) === 0, 400, 'Select at least one skill');

        $valid = MstrService::whereIn('service_id', $serviceIds)->where('is_active', true)->get(['service_id', 'category_id']);
        abort_if($valid->count() !== count($serviceIds), 400, 'One or more selected services are invalid');

        MapTechnicianService::where('technician_id', $technicianId)->delete();
        $mapped = [];
        foreach ($serviceIds as $serviceId) {
            $mapped[] = MapTechnicianService::create(['technician_id' => $technicianId, 'service_id' => $serviceId, 'is_active' => true, 'created_by' => 'technician', 'created_at' => now()]);
        }

        $primaryCategoryId = $valid->first()?->category_id;
        if ($primaryCategoryId) {
            Technician::where('technician_id', $technicianId)->update(['category_id' => $primaryCategoryId, 'sub_category_id' => $serviceIds[0], 'updated_by' => 'technician', 'updated_at' => now()]);
        }

        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'message' => 'Skills saved successfully', 'data' => $mapped, 'registration_progress' => $progress]);
    }

    private function isSelfieDocumentTypeName(?string $name): bool
    {
        return (bool) preg_match('/\bselfie\b/i', (string) $name);
    }

    /** POST /api/technician/registration/upload-document */
    public function uploadDocument(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $documentTypeId = $request->input('documentTypeId') ?? $request->input('document_type_id') ?? $request->input('documentTypeID');
        $documentNumber = trim((string) ($request->input('documentNumber') ?? $request->input('document_number') ?? ''));

        $attachment = null;
        if ($request->hasFile('attachment')) {
            $attachment = $this->uploads->store($request->file('attachment'), UploadSlots::TECH_DOCUMENT, $technicianId);
        } else {
            $attachment = $request->input('attachment') ?? $request->input('attachement') ?? $request->input('file') ?? $request->input('filePath') ?? $request->input('file_path') ?? $request->input('documentUrl') ?? $request->input('document_url');
        }

        abort_if(! $documentTypeId || ! $attachment, 400, 'documentTypeId and attachment file are required');
        abort_if($documentNumber === '', 400, 'documentNumber is required');

        $docType = LkpDocumentType::where('document_type_id', $documentTypeId)->where('is_active', true)
            ->whereRaw($this->appliesToTechnicianClause())->first();
        abort_if(! $docType, 400, 'Document type is invalid or not configured for technicians');
        abort_if($this->isSelfieDocumentTypeName($docType->document_type), 400, 'Use /registration/upload-selfie for selfie upload');

        $existing = TechnicianDocument::where('technician_id', $technicianId)->where('document_type_id', $documentTypeId)->where('is_active', true)->first();
        if ($existing) {
            $existing->update(['document_number' => $documentNumber, 'attachement' => $attachment, 'is_verified' => false, 'updated_by' => 'technician', 'updated_at' => now()]);
            $doc = $existing->fresh();
        } else {
            $doc = TechnicianDocument::create([
                'technician_id' => $technicianId, 'document_type_id' => $documentTypeId, 'document_number' => $documentNumber,
                'attachement' => $attachment, 'status_id' => 1, 'is_verified' => false, 'is_active' => true,
                'created_by' => 'system', 'created_at' => now(),
            ]);
        }

        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'message' => 'Document uploaded successfully', 'data' => $doc, 'registration_progress' => $progress]);
    }

    /** POST /api/technician/registration/upload-selfie */
    public function uploadSelfie(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $fileName = null;
        if ($request->hasFile('attachment')) {
            $fileName = $this->uploads->store($request->file('attachment'), UploadSlots::TECH_SELFIE, $technicianId, true);
        } else {
            $fileName = $request->input('selfiePhoto') ?? $request->input('selfie_photo');
        }
        abort_if(! $fileName, 400, 'Selfie image file (attachment) is required');

        Technician::where('technician_id', $technicianId)->update(['selfie_photo' => $fileName, 'is_selfie_verified' => false, 'updated_by' => 'technician', 'updated_at' => now()]);
        $updated = Technician::find($technicianId);
        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'message' => 'Selfie uploaded successfully', 'data' => ['selfiePhoto' => $updated->selfie_photo, 'isSelfieVerified' => $updated->is_selfie_verified], 'registration_progress' => $progress]);
    }

    private function upsertBankDetails(int $technicianId, array $payload): TechnicianBankDetail
    {
        $existing = TechnicianBankDetail::where('technician_id', $technicianId)->where('is_active', true)->first();
        if ($existing) {
            $existing->update(array_merge($payload, ['is_verified' => false, 'updated_at' => now()]));

            return $existing->fresh();
        }

        return TechnicianBankDetail::create(array_merge($payload, [
            'technician_id' => $technicianId, 'status_id' => 1, 'is_verified' => false, 'is_active' => true,
            'created_by' => 'system', 'created_at' => now(),
        ]));
    }

    /** POST /api/technician/registration/bank-details */
    public function bankDetails(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $technician = $this->svc->loadForRegistration($technicianId);

        $method = strtoupper((string) ($request->input('paymentMethod') ?? $request->input('payment_method') ?? 'BANK'));

        if ($method === 'UPI') {
            $upiId = $request->input('upiId') ?? $request->input('upi_id');
            abort_if(! $upiId, 400, 'upiId is required for UPI');
            $payload = [
                'acount_holder_name' => $request->input('accountHolderName') ?? $technician->first_name,
                'account_number' => trim($upiId), 'ifsc_number' => 'UPI', 'account_type' => 'U', 'updated_by' => 'technician',
            ];
        } else {
            $holder = $request->input('accountHolderName');
            $number = $request->input('accountNumber');
            $ifsc = $request->input('ifscNumber');
            abort_if(! $holder || ! $number || ! $ifsc, 400, 'accountHolderName, accountNumber, and ifscNumber are required');
            $payload = [
                'acount_holder_name' => $holder, 'account_number' => $number, 'ifsc_number' => $ifsc,
                'account_type' => $request->input('accountType') ?? $request->input('account_type') ?? 'C', 'updated_by' => 'technician',
            ];
        }

        $bank = $this->upsertBankDetails($technicianId, $payload);
        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'message' => 'Bank details saved successfully', 'data' => array_merge($bank->toArray(), ['payment_method' => $method]), 'registration_progress' => $progress]);
    }

    /** POST /api/technician/registration/upi-verification-order */
    public function upiVerificationOrder(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $adapter = $this->gateways->get('razorpay');
        abort_if(! $adapter || ! $adapter->isConfigured(), 503, 'Payment gateway not configured. Contact admin.');

        try {
            $result = $adapter->createOrder(['amount' => 1, 'receipt' => 'upi_verify_'.$technicianId.'_'.now()->timestamp, 'bookingId' => 0, 'notes' => ['purpose' => 'upi_verification', 'technician_id' => (string) $technicianId]]);
        } catch (\Throwable) {
            return response()->json(['status' => false, 'message' => 'Failed to create verification order.'], 500);
        }

        return response()->json(['status' => true, 'orderId' => $result['gatewayOrderId'], 'amount' => 1, 'currency' => 'INR', 'keyId' => $result['razorpay_key_id'] ?? null]);
    }

    /** POST /api/technician/registration/confirm-upi-payment */
    public function confirmUpiPayment(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $technician = $this->svc->loadForRegistration($technicianId);

        $orderId = $request->input('razorpayOrderId');
        $paymentId = $request->input('razorpayPaymentId');
        $signature = $request->input('razorpaySignature');
        $upiId = $request->input('upiId');
        abort_if(! $orderId || ! $paymentId || ! $signature, 400, 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.');
        abort_if(! $upiId, 400, 'upiId is required.');

        $adapter = $this->gateways->get('razorpay');
        try {
            $valid = $adapter instanceof \App\Services\Payment\RazorpayGateway && $adapter->verifySignature($orderId, $paymentId, $signature);
        } catch (\Throwable) {
            $valid = false;
        }
        abort_if(! $valid, 400, 'Invalid payment signature. Please try again.');

        $bank = $this->upsertBankDetails($technicianId, [
            'acount_holder_name' => trim((string) ($request->input('accountHolderName') ?? $technician->first_name ?? '')),
            'account_number' => trim($upiId), 'ifsc_number' => 'UPI', 'account_type' => 'U', 'updated_by' => 'technician',
        ]);
        $bank->update(['is_verified' => true, 'updated_at' => now()]);

        $progress = $this->svc->buildProgress($technicianId);

        return response()->json(['status' => true, 'verified' => true, 'message' => 'UPI verified successfully.', 'registration_progress' => $progress]);
    }

    /** POST /api/technician/registration/verify-upi — works even after approval. */
    public function verifyUpiId(Request $request)
    {
        $upiId = trim((string) $request->input('upiId'));
        abort_if($upiId === '', 400, 'upiId is required');
        abort_if(! preg_match('/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/', $upiId), 400, 'Invalid UPI ID format');

        $adapter = $this->gateways->get('razorpay');
        abort_if(! $adapter || ! $adapter->isConfigured(), 503, 'Payment gateway not configured. Contact admin.');

        $result = $adapter instanceof \App\Services\Payment\RazorpayGateway ? $adapter->validateUpiVpa($upiId) : ['valid' => false, 'customerName' => null];

        return response()->json([
            'status' => true, 'valid' => $result['valid'], 'customerName' => $result['customerName'] ?? null, 'vpa' => $result['vpa'] ?? $upiId,
            'message' => $result['valid'] ? 'UPI verified — Account holder: '.($result['customerName'] ?? '') : 'UPI ID not found. Please check and try again.',
        ]);
    }

    /** POST /api/technician/registration/resubmit-corrections */
    public function resubmitCorrections(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        abort_if(! Technician::where('technician_id', $technicianId)->exists(), 404, 'Technician not found');

        $rejected = TechnicianSectionReview::where('technician_id', $technicianId)->where('status', 'rejected')->pluck('section');
        abort_if($rejected->isEmpty(), 400, 'No rejected sections to resubmit');

        TechnicianSectionReview::where('technician_id', $technicianId)->where('status', 'rejected')
            ->update(['status' => 'pending', 'remark' => null, 'reviewed_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Corrections submitted for admin review.', 'data' => ['resubmitted_sections' => $rejected]]);
    }

    /** POST /api/technician/registration/submit */
    public function submit(Request $request)
    {
        $technicianId = $request->user()->technician_id;
        $this->svc->loadForRegistration($technicianId);

        $accepted = collect(['servicePartnerAgreementAccepted', 'service_partner_agreement_accepted', 'agreementAccepted', 'agreement_accepted'])
            ->contains(fn ($key) => $request->input($key) === true);
        abort_if(! $accepted, 400, 'You must accept the Service Partner Agreement before submitting.');

        $progress = $this->svc->buildProgress($technicianId);
        if (! $progress['can_submit']) {
            return response()->json(['status' => false, 'message' => 'Complete all registration steps before submitting', 'registration_progress' => $progress], 400);
        }

        Technician::where('technician_id', $technicianId)->update(['application_status' => 'pending', 'application_reject_reason' => null, 'updated_by' => 'technician', 'updated_at' => now()]);
        TechnicianSectionReview::where('technician_id', $technicianId)->where('status', 'rejected')->update(['status' => 'pending', 'remark' => null, 'reviewed_at' => now()]);

        PartnerAgreementAcceptanceLog::create([
            'technician_id' => $technicianId,
            // version_label is NOT NULL with no DB default — fall back to a
            // stand-in label when the client doesn't send one explicitly.
            'version_label' => $request->input('agreementVersion') ?? $request->input('agreement_version') ?? 'v1',
            'accepted_at' => now(), 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'source' => $request->input('source', 'web'), 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Application submitted. Awaiting admin approval.', 'data' => ['technician_id' => $technicianId, 'application_submitted' => true, 'application_status' => 'pending', 'is_pending_review' => true]]);
    }
}
