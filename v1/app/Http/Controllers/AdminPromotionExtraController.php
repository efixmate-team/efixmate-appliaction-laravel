<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Promotion;
use Illuminate\Http\Request;

/**
 * Bespoke promotion endpoints from server/.../admin.routes.js that go beyond plain
 * CRUD (which is already served by the generic /master/promotions engine):
 * analytics, preview, duplicate, reorder, bulk-action.
 */
class AdminPromotionExtraController extends Controller
{
    /** GET /api/admin/promotions/analytics */
    public function analytics()
    {
        $now = now();
        $total = Promotion::count();
        $active = Promotion::where('is_active', true)->where('is_disabled', false)
            ->where(function ($q) use ($now) { $q->whereNull('start_at')->orWhere('start_at', '<=', $now); })
            ->where(function ($q) use ($now) { $q->whereNull('end_at')->orWhere('end_at', '>=', $now); })
            ->count();
        $scheduled = Promotion::where('is_scheduled', true)->where('start_at', '>', $now)->count();
        $expired = Promotion::whereNotNull('end_at')->where('end_at', '<', $now)->count();
        $byScope = Promotion::selectRaw('scope_type, COUNT(*) as total')->groupBy('scope_type')->pluck('total', 'scope_type');

        return response()->json(['status' => true, 'data' => [
            'total' => $total, 'active' => $active, 'scheduled' => $scheduled, 'expired' => $expired, 'by_scope' => $byScope,
        ]]);
    }

    /** GET /api/admin/promotions/{id}/preview */
    public function preview(int $id)
    {
        $promo = Promotion::findOrFail($id);

        return response()->json(['status' => true, 'data' => [
            'id' => $promo->announcement_id, 'title' => $promo->title, 'subtitle' => $promo->subtitle,
            'description' => $promo->description, 'image' => $promo->mobile_image_url ?? $promo->desktop_image_url,
            'background_color' => $promo->background_color, 'cta_text' => $promo->cta_text,
            'coupon_code' => $promo->coupon_code, 'discount_type' => $promo->discount_type, 'discount_value' => $promo->discount_value,
        ]]);
    }

    /** POST /api/admin/promotions/{id}/duplicate */
    public function duplicate(int $id)
    {
        $promo = Promotion::findOrFail($id);
        $clone = $promo->replicate(['announcement_id']);
        $clone->title = $promo->title.' (Copy)';
        $clone->is_active = false;
        $clone->created_at = now();
        $clone->save();

        return response()->json(['status' => true, 'message' => 'Promotion duplicated', 'data' => $clone], 201);
    }

    /** POST /api/admin/promotions/reorder */
    public function reorder(Request $request)
    {
        $data = $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']]);
        foreach ($data['order'] as $priority => $announcementId) {
            Promotion::where('announcement_id', $announcementId)->update(['priority' => count($data['order']) - $priority, 'updated_at' => now()]);
        }

        return response()->json(['status' => true, 'message' => 'Promotions reordered']);
    }

    /** POST /api/admin/promotions/bulk-action */
    public function bulkAction(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'], 'ids.*' => ['integer'],
            'action' => ['required', 'string', 'in:activate,deactivate,delete'],
        ]);

        $query = Promotion::whereIn('announcement_id', $data['ids']);
        match ($data['action']) {
            'activate' => $query->update(['is_active' => true, 'is_disabled' => false, 'updated_at' => now()]),
            'deactivate' => $query->update(['is_disabled' => true, 'updated_at' => now()]),
            'delete' => $query->update(['is_deleted' => true, 'updated_at' => now()]),
        };

        return response()->json(['status' => true, 'message' => 'Bulk action applied', 'affected' => count($data['ids'])]);
    }
}
