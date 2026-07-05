<?php

namespace App\Http\Controllers;

use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\MstrCoupon;
use Efixmate\Domain\Models\Promotion;
use Illuminate\Http\Request;

/**
 * Direct port of getHomeCarousel/getHomeOffers (server/.../user.controller.js) and
 * handleListCoupons (server/.../bookingCheckout.controller.js).
 */
class PromotionController extends Controller
{
    /** GET /api/user/promotions/home/carousel */
    public function carousel(Request $request)
    {
        $now = now();
        $rows = Promotion::where('is_active', true)->where('is_disabled', false)
            ->where(function ($q) { $q->whereNull('scope_type')->orWhere('scope_type', 'HOME_CAROUSEL'); })
            ->where(function ($q) use ($now) { $q->whereNull('start_at')->orWhere('start_at', '<=', $now); })
            ->where(function ($q) use ($now) { $q->whereNull('end_at')->orWhere('end_at', '>=', $now); })
            ->orderByDesc('priority')->orderByDesc('announcement_id')
            ->limit(10)->get();

        $result = $rows->map(fn ($p) => [
            'id' => $p->announcement_id, 'title' => $p->title, 'subtitle' => $p->subtitle,
            'image' => PublicUrlResolver::resolve($request, $p->mobile_image_url ?? $p->desktop_image_url),
            'desktop_image' => PublicUrlResolver::resolve($request, $p->desktop_image_url),
            'background_color' => $p->background_color, 'cta_text' => $p->cta_text,
            'cta_action_type' => $p->cta_action_type, 'cta_value' => $p->cta_value,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    /** GET /api/user/promotions/home/offers */
    public function offers(Request $request)
    {
        $now = now();
        $rows = Promotion::where('is_active', true)->where('is_disabled', false)
            ->where('scope_type', 'HOME_OFFER')
            ->where(function ($q) use ($now) { $q->whereNull('start_at')->orWhere('start_at', '<=', $now); })
            ->where(function ($q) use ($now) { $q->whereNull('end_at')->orWhere('end_at', '>=', $now); })
            ->orderByDesc('priority')->orderByDesc('announcement_id')
            ->limit(10)->get();

        $result = $rows->map(fn ($p) => [
            'id' => $p->announcement_id, 'title' => $p->title, 'description' => $p->description,
            'image' => PublicUrlResolver::resolve($request, $p->mobile_image_url ?? $p->desktop_image_url),
            'coupon_code' => $p->coupon_code, 'discount_type' => $p->discount_type, 'discount_value' => $p->discount_value,
            'min_order_amount' => $p->min_order_amount, 'max_discount' => $p->max_discount,
            'cta_text' => $p->cta_text, 'cta_action_type' => $p->cta_action_type, 'cta_value' => $p->cta_value,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    /** GET /api/user/coupons */
    public function couponsList()
    {
        $now = now();
        $rows = MstrCoupon::where('is_active', true)
            ->where(function ($q) use ($now) { $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now); })
            ->where(function ($q) use ($now) { $q->whereNull('valid_until')->orWhere('valid_until', '>=', $now); })
            ->orderByDesc('coupon_id')->get();

        $result = $rows->map(fn ($c) => [
            'coupon_id' => $c->coupon_id, 'coupon_code' => $c->coupon_code, 'discount_type' => $c->discount_type,
            'discount_value' => $c->discount_value, 'min_order_amount' => $c->min_order_amount,
            'max_discount_amount' => $c->max_discount_amount, 'valid_from' => $c->valid_from, 'valid_until' => $c->valid_until,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }
}
