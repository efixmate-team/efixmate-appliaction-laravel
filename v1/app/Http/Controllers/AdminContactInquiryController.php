<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\ContactInquiry;
use Illuminate\Http\Request;

/** Direct port of server/.../admin/contactInquiries.routes.js. */
class AdminContactInquiryController extends Controller
{
    /** GET /api/admin/contact-inquiries */
    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));

        $query = ContactInquiry::query();
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $total = (clone $query)->count();
        $data = $query->orderByDesc('inquiry_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/contact-inquiries/{id} */
    public function show(int $id)
    {
        return response()->json(['status' => true, 'data' => ContactInquiry::findOrFail($id)]);
    }

    /** POST /api/admin/contact-inquiries/{id}/resolve */
    public function resolve(Request $request, int $id)
    {
        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->update([
            'status' => 'resolved', 'admin_notes' => $request->input('notes'),
            'resolved_at' => now(), 'resolved_by' => $request->user()->admin_id, 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Inquiry resolved', 'data' => $inquiry->fresh()]);
    }

    /** POST /api/admin/contact-inquiries/{id}/status */
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate(['status' => ['required', 'string']]);
        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->update(['status' => $data['status'], 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Status updated', 'data' => $inquiry->fresh()]);
    }
}
