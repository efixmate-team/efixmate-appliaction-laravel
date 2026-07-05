<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
 | Legacy non-admin Next.js route compatibility map.
 | Admin routes are owned by routes/admin.php and the Vue AdminShell.
 */

Route::get('profile/coupons', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/profile/coupons/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('profile/payments', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/profile/payments/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('profile/referral', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/profile/referral/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/login', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/login/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/register', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/register/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('about-us', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(company)/about-us/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('account-deletion-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/account-deletion-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('become-a-partner', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/become-a-partner/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('bookings', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/bookings/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('cancellation-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/cancellation-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('cart', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/cart/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('contact-us', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(company)/contact-us/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('cookie-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/cookie-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('disclaimer', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/disclaimer/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('faq', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/faq/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('grievance-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/grievance-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('offers', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/offers/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('payment', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/payment/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('privacy-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/privacy-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('profile', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/profile/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('refund-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/refund-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('safety-and-verification', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/safety-and-verification/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('service-partner-agreement', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/service-partner-agreement/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('services', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/services/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('services-in', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/services-in/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('terms-and-conditions', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/terms-and-conditions/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('warranty-policy', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/(legal)/warranty-policy/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('/', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('bookings/{bookingId}/track', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/bookings/[bookingId]/track/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/{technicianId}/Completed-Jobs', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/[technicianId]/Completed-Jobs/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/{technicianId}/dashboard', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/[technicianId]/dashboard/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/{technicianId}/Earnings', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/[technicianId]/Earnings/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/{technicianId}/Job-Requests', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/[technicianId]/Job-Requests/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('technician/{technicianId}/profile', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/technician/[technicianId]/profile/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('bookings/{bookingId}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/bookings/[bookingId]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('login/{uid}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(auth)/login/[uid]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('service/{serviceId}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(user)/service/[serviceId]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('services-in/{city}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/services-in/[city]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('{slug}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(landing)/[slug]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('services-in/{city}/{service}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/services-in/[city]/[service]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('{slug}/{service}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(seo)/[slug]/[service]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('services-in/{city}/{service}/{detail}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/services-in/[city]/[service]/[detail]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));
Route::get('{slug}/{service}/{detail}', fn () => Inertia::render('LegacyPage', ['source' => 'client/app/(public)/(seo)/[slug]/[service]/[detail]/page.tsx', 'path' => request()->path(), 'params' => request()->route()?->parameters() ?? []]));