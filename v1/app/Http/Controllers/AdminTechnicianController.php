<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianBankDetail;
use Efixmate\Domain\Models\TechnicianDocument;
use Efixmate\Domain\Models\TechnicianSectionReview;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Direct port of the technician-management cluster in
 * server/src/modules/admin/routes/admin.routes.js: paginated list, detail,
 * create, verify-document, verify-bank, approve/reject application, per-section review.
 */
class AdminTechnicianController extends Controller
{
    /** POST /api/admin/technicians/paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = (int) $request->input('limit', 10);
        $search = $request->input('search');
        $status = $request->input('application_status');

        $query = Technician::query();
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('mobile_number', 'like', "%{$search}%")
                    ->orWhere('technician_unique_id', 'like', "%{$search}%");
            });
        }
        if ($status) {
            $query->where('application_status', $status);
        }

        $total = (clone $query)->count();
        $data = $query->orderByDesc('technician_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'message' => 'Technicians fetched', 'data' => ApiResponseFilter::filter($data->toArray(), 'technician_id'),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/technicians/{id} */
    public function show(int $id)
    {
        $technician = Technician::findOrFail($id);
        $documents = TechnicianDocument::where('technician_id', $id)->where('is_active', true)->get();
        $bank = TechnicianBankDetail::where('technician_id', $id)->where('is_active', true)->first();
        $reviews = TechnicianSectionReview::where('technician_id', $id)->orderByDesc('reviewed_at')->get();

        return response()->json(['status' => true, 'data' => [
            'technician' => $technician, 'documents' => $documents, 'bank_details' => $bank, 'section_reviews' => $reviews,
        ]]);
    }

    /** POST /api/admin/technicians/create */
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['nullable', 'string'],
            'mobile_number' => ['required', 'string', 'unique:efm_technicians,mobile_number'],
            'email' => ['nullable', 'email'],
            'category_id' => ['nullable', 'integer'],
        ]);

        $technician = Technician::create(array_merge($data, [
            'technician_unique_id' => (string) Str::uuid(), 'status_id' => 1, 'is_active' => true,
            'is_selfie_verified' => false, 'application_status' => 'pending', 'current_jobs' => 0, 'max_jobs' => 3,
            'created_by' => 'admin', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Technician created', 'data' => $technician], 201);
    }

    /** POST /api/admin/technicians/verify-document */
    public function verifyDocument(Request $request)
    {
        $data = $request->validate([
            'document_id' => ['required', 'integer'],
            'is_verified' => ['required', 'boolean'],
            'reject_remark' => ['nullable', 'string'],
        ]);
        $doc = TechnicianDocument::findOrFail($data['document_id']);
        $doc->update([
            'is_verified' => $data['is_verified'],
            'reject_remark' => $data['is_verified'] ? null : ($data['reject_remark'] ?? null),
            'updated_by' => 'admin', 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Document reviewed', 'data' => $doc->fresh()]);
    }

    /** POST /api/admin/technicians/verify-bank */
    public function verifyBank(Request $request)
    {
        $data = $request->validate(['bank_id' => ['required', 'integer'], 'is_verified' => ['required', 'boolean']]);
        $bank = TechnicianBankDetail::findOrFail($data['bank_id']);
        $bank->update(['is_verified' => $data['is_verified'], 'updated_by' => 'admin', 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Bank details reviewed', 'data' => $bank->fresh()]);
    }

    /** POST /api/admin/technicians/review-section */
    public function reviewSection(Request $request)
    {
        $data = $request->validate([
            'technician_id' => ['required', 'integer'],
            'section' => ['required', 'string'],
            'status' => ['required', 'string', 'in:approved,rejected'],
            'remark' => ['nullable', 'string'],
        ]);

        $review = TechnicianSectionReview::updateOrCreate(
            ['technician_id' => $data['technician_id'], 'section' => $data['section']],
            ['status' => $data['status'], 'remark' => $data['remark'] ?? null, 'reviewed_by' => 'admin', 'reviewed_at' => now()],
        );

        return response()->json(['status' => true, 'message' => 'Section reviewed', 'data' => $review]);
    }

    /** POST /api/admin/technicians/approve */
    public function approve(Request $request)
    {
        $data = $request->validate([
            'technician_id' => ['required', 'integer'],
            'approved' => ['required', 'boolean'],
            'reject_reason' => ['nullable', 'string'],
        ]);
        $technician = Technician::findOrFail($data['technician_id']);
        $technician->update([
            'application_status' => $data['approved'] ? 'approved' : 'rejected',
            'application_reject_reason' => $data['approved'] ? null : ($data['reject_reason'] ?? null),
            'is_active' => $data['approved'] ? true : $technician->is_active,
            'updated_by' => 'admin', 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => $data['approved'] ? 'Technician approved' : 'Technician rejected', 'data' => $technician->fresh()]);
    }

    /** GET /api/admin/technicians/{id}/jobs */
    public function jobs(Request $request, int $id)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 10);

        $query = Booking::where('technician_id', $id);
        $total = (clone $query)->count();
        $data = $query->orderByDesc('booking_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }
}
