<?php

use App\Http\Controllers\AdminBookingController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Auth\CustomerOtpController;
use App\Http\Controllers\Auth\TechnicianOtpController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\LookupCrudController;
use App\Http\Controllers\MasterCrudController;
use App\Http\Controllers\BookingCartController;
use App\Http\Controllers\BookingCheckoutController;
use App\Http\Controllers\BookingFeatureController;
use App\Http\Controllers\BookingTrackController;
use App\Http\Controllers\CustomerBookingListController;
use App\Http\Controllers\CustomerDeviceController;
use App\Http\Controllers\CustomerReferralController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ServiceDiscoveryController;
use App\Http\Controllers\TechnicianBookingController;
use App\Http\Controllers\WalletController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/login-dev', [AdminAuthController::class, 'loginDev']);
Route::post('/admin/login/verify-2fa', [AdminAuthController::class, 'verify2fa']);

Route::middleware(['auth:sanctum', 'admin.token'])->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/profile', [AdminAuthController::class, 'profile']);

    Route::get('/admin/dashboard/stats', [\App\Http\Controllers\AdminDashboardController::class, 'stats']);
    Route::get('/admin/dashboard/recent-bookings', [\App\Http\Controllers\AdminDashboardController::class, 'recentBookings']);
    Route::get('/admin/dashboard/top-services', [\App\Http\Controllers\AdminDashboardController::class, 'topServices']);
    Route::get('/admin/dashboard/activity', [\App\Http\Controllers\AdminDashboardController::class, 'activity']);

    // Admin Management (admins, roles, privileges, role-permission mapping, menus)
    Route::post('/admin/create', [\App\Http\Controllers\AdminManagementController::class, 'store']);
    Route::post('/admin/admin-paginated', [\App\Http\Controllers\AdminManagementController::class, 'paginated']);
    Route::post('/admin/get', [\App\Http\Controllers\AdminManagementController::class, 'show']);
    Route::post('/admin/update', [\App\Http\Controllers\AdminManagementController::class, 'update']);
    Route::post('/admin/toggle-status', [\App\Http\Controllers\AdminManagementController::class, 'toggleStatus']);
    Route::post('/admin/reset-password', [\App\Http\Controllers\AdminManagementController::class, 'resetPassword']);

    Route::post('/admin/roles-create', [\App\Http\Controllers\AdminRoleManagementController::class, 'store']);
    Route::post('/admin/role-paginated', [\App\Http\Controllers\AdminRoleManagementController::class, 'paginated']);
    Route::post('/admin/roles-update', [\App\Http\Controllers\AdminRoleManagementController::class, 'update']);
    Route::post('/admin/roles-delete', [\App\Http\Controllers\AdminRoleManagementController::class, 'destroy']);
    Route::post('/admin/roles-toggle', [\App\Http\Controllers\AdminRoleManagementController::class, 'toggle']);
    Route::get('/admin/roles-dropdown', [\App\Http\Controllers\AdminRoleManagementController::class, 'dropdown']);

    Route::post('/admin/privileges-create', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'store']);
    Route::post('/admin/privileges-list', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'index']);
    Route::post('/admin/privileges-list-with-menu', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'listWithMenu']);
    Route::post('/admin/privileges-by-menu', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'byMenu']);
    Route::post('/admin/privileges-update', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'update']);
    Route::post('/admin/privileges-delete', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'destroy']);
    Route::post('/admin/privileges-toggle', [\App\Http\Controllers\AdminPrivilegeManagementController::class, 'toggle']);

    Route::post('/admin/role-permissions', [\App\Http\Controllers\AdminRolePermissionController::class, 'show']);
    Route::post('/admin/role-permissions-toggle', [\App\Http\Controllers\AdminRolePermissionController::class, 'toggle']);

    Route::post('/admin/create-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'store']);
    Route::post('/admin/update-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'update']);
    Route::post('/admin/deactivate-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'deactivate']);
    Route::post('/admin/activate-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'activate']);
    Route::post('/admin/bulk-deactivate-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'bulkDeactivate']);
    Route::post('/admin/bulk-activate-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'bulkActivate']);
    Route::post('/admin/menu-paginated', [\App\Http\Controllers\AdminMenuManagementController::class, 'paginated']);
    Route::get('/admin/get-parents', [\App\Http\Controllers\AdminMenuManagementController::class, 'parents']);
    Route::get('/admin/get-groups', [\App\Http\Controllers\AdminMenuManagementController::class, 'groups']);
    Route::post('/admin/delete-menus', [\App\Http\Controllers\AdminMenuManagementController::class, 'destroy']);

    // Customer management
    Route::post('/admin/users/paginated', [\App\Http\Controllers\AdminCustomerController::class, 'paginated']);
    Route::post('/admin/users/create', [\App\Http\Controllers\AdminCustomerController::class, 'store']);
    Route::post('/admin/users/update', [\App\Http\Controllers\AdminCustomerController::class, 'update']);
    Route::post('/admin/users/verify', [\App\Http\Controllers\AdminCustomerController::class, 'verify']);
    Route::get('/admin/users/{id}', [\App\Http\Controllers\AdminCustomerController::class, 'show'])->whereNumber('id');
    Route::get('/admin/users/{id}/bookings', [\App\Http\Controllers\AdminCustomerController::class, 'bookings'])->whereNumber('id');
    Route::get('/admin/users/{id}/addresses', [\App\Http\Controllers\AdminCustomerController::class, 'addresses'])->whereNumber('id');
    Route::get('/admin/users/{id}/activity-logs', [\App\Http\Controllers\AdminCustomerController::class, 'activityLogs'])->whereNumber('id');

    // Technician management
    Route::post('/admin/technicians/paginated', [\App\Http\Controllers\AdminTechnicianController::class, 'paginated']);
    Route::post('/admin/technicians/create', [\App\Http\Controllers\AdminTechnicianController::class, 'store']);
    Route::post('/admin/technicians/verify-document', [\App\Http\Controllers\AdminTechnicianController::class, 'verifyDocument']);
    Route::post('/admin/technicians/verify-bank', [\App\Http\Controllers\AdminTechnicianController::class, 'verifyBank']);
    Route::post('/admin/technicians/review-section', [\App\Http\Controllers\AdminTechnicianController::class, 'reviewSection']);
    Route::post('/admin/technicians/approve', [\App\Http\Controllers\AdminTechnicianController::class, 'approve']);
    Route::get('/admin/technicians/{id}', [\App\Http\Controllers\AdminTechnicianController::class, 'show'])->whereNumber('id');
    Route::get('/admin/technicians/{id}/jobs', [\App\Http\Controllers\AdminTechnicianController::class, 'jobs'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'admin.token'])->group(function () {
    Route::prefix('master')->group(function () {
        foreach (array_keys(config('master_resources')) as $resource) {
            Route::get("/$resource", [MasterCrudController::class, 'index'])->defaults('resource', $resource);
            Route::get("/$resource/{id}", [MasterCrudController::class, 'show'])->defaults('resource', $resource);
            Route::post("/$resource", [MasterCrudController::class, 'store'])->defaults('resource', $resource);
            Route::put("/$resource/{id}", [MasterCrudController::class, 'update'])->defaults('resource', $resource);
            Route::delete("/$resource/{id}", [MasterCrudController::class, 'destroy'])->defaults('resource', $resource);
        }
    });

    Route::prefix('lookup')->group(function () {
        foreach (array_keys(config('lookup_resources')) as $resource) {
            Route::get("/$resource", [LookupCrudController::class, 'index'])->defaults('resource', $resource);
            Route::get("/$resource/{id}", [LookupCrudController::class, 'show'])->defaults('resource', $resource);
            Route::post("/$resource", [LookupCrudController::class, 'store'])->defaults('resource', $resource);
            Route::put("/$resource/{id}", [LookupCrudController::class, 'update'])->defaults('resource', $resource);
            Route::delete("/$resource/{id}", [LookupCrudController::class, 'destroy'])->defaults('resource', $resource);
        }
    });
});

Route::prefix('customer')->name('customer.')->group(function () {
    Route::post('/send-otp', [CustomerOtpController::class, 'sendOtp'])->name('send-otp');
    Route::post('/verify-otp', [CustomerOtpController::class, 'verifyOtp'])->name('verify-otp');

    Route::middleware(['auth:sanctum', 'customer.token'])->group(function () {
        Route::get('/me', fn (Request $request) => $request->user());

        Route::post('/booking/initiate', [BookingController::class, 'initiate']);
        Route::post('/booking/create', [BookingController::class, 'create']);
        Route::get('/booking/{booking}/pricing-snapshot', [BookingController::class, 'pricingSnapshot']);
        Route::get('/booking/{booking}/price-breakdown', [BookingController::class, 'priceBreakdown']);
        Route::post('/booking/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    });
});

// /user/* — mirrors Node's app.use('/user', userRoutes) mount path exactly (Stage 4).
// Reuses the same customer.token Sanctum guard as /customer/* (foundation phase);
// /customer/* is left in place unchanged, this adds the literal Node-parity paths.
Route::prefix('user')->name('user.')->group(function () {
    Route::post('/send-otp', [CustomerOtpController::class, 'sendOtp']);
    Route::post('/verify-otp', [CustomerOtpController::class, 'verifyOtp']);
    Route::post('/logout', function (Request $request) {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['status' => true, 'message' => 'Logged out successfully']);
    })->middleware(['auth:sanctum', 'customer.token']);

    Route::middleware(['auth:sanctum', 'customer.token'])->group(function () {
        Route::get('/profile', [ProfileController::class, 'profile']);
        Route::post('/update-profile', [ProfileController::class, 'updateProfile']);
        Route::post('/address', [ProfileController::class, 'updateAddress']);
        Route::get('/address', [ProfileController::class, 'getAddresses']);
        Route::post('/activate-address', [ProfileController::class, 'activateAddress']);
        Route::post('/delete-address', [ProfileController::class, 'deleteAddress']);
        Route::post('/address/delete', [ProfileController::class, 'deleteAddress']);

        Route::get('/services/categories', [ServiceDiscoveryController::class, 'areaBasedCategories']);
        Route::get('/services/list', [ServiceDiscoveryController::class, 'areaBasedServiceList']);

        Route::get('/wallet', [WalletController::class, 'show']);
        Route::post('/bookings/{bookingId}/review', [ReviewController::class, 'submit'])->whereNumber('bookingId');
        Route::get('/bookings/{bookingId}/review', [ReviewController::class, 'show'])->whereNumber('bookingId');

        Route::post('/home/device/register', [CustomerDeviceController::class, 'registerDevice']);
        Route::get('/notifications/unread-count', [CustomerDeviceController::class, 'unreadCount']);

        Route::get('/referral', [CustomerReferralController::class, 'show']);
        Route::post('/referral/apply', [CustomerReferralController::class, 'apply']);

        Route::post('/booking/reschedule', [BookingFeatureController::class, 'reschedule']);
        Route::post('/booking/repeat', [BookingFeatureController::class, 'repeat']);
        Route::post('/booking/emergency', [BookingFeatureController::class, 'emergency']);
        Route::post('/booking/recurring', [BookingFeatureController::class, 'recurring']);
        Route::post('/booking/cancel', [BookingFeatureController::class, 'cancel']);
        Route::post('/booking/notes', [BookingFeatureController::class, 'notes']);
        Route::post('/booking/upload-images', [BookingFeatureController::class, 'uploadImages']);
        Route::post('/booking/upload-video', [BookingFeatureController::class, 'uploadVideo']);
        Route::get('/bookings/{bookingId}/timeline', [BookingFeatureController::class, 'timeline'])->whereNumber('bookingId');
        Route::get('/bookings/{bookingId}/invoice', [BookingFeatureController::class, 'invoice'])->whereNumber('bookingId');

        Route::get('/bookings', [CustomerBookingListController::class, 'index']);

        Route::post('/booking/cart', [BookingCartController::class, 'open']);
        Route::post('/booking/cart/ensure', [BookingCartController::class, 'ensure']);
        Route::get('/booking/cart', [BookingCartController::class, 'show']);
        Route::patch('/booking/cart', [BookingCartController::class, 'update']);
        Route::delete('/booking/cart', [BookingCartController::class, 'destroy']);
        Route::get('/booking/cart/slots', [BookingCartController::class, 'slots']);
        Route::get('/booking/cart/slots-by-address', [BookingCartController::class, 'slotsByAddress']);
        Route::post('/booking/cart/quote', [BookingCartController::class, 'quote']);
        Route::post('/booking/cart/lock', [BookingCartController::class, 'lock']);
        Route::post('/booking/cart/prepare-locks', [BookingCartController::class, 'lock']);
        Route::get('/booking/cart/lines-availability', [BookingCartController::class, 'linesAvailability']);
        Route::post('/booking/cart/lines', [BookingCartController::class, 'addLine']);
        Route::patch('/booking/cart/lines/{lineId}', [BookingCartController::class, 'updateLine'])->whereNumber('lineId');
        Route::delete('/booking/cart/lines/{lineId}', [BookingCartController::class, 'deleteLine'])->whereNumber('lineId');
        Route::post('/booking/cart/lines/{lineId}/photos', [BookingCartController::class, 'uploadLinePhotos'])->whereNumber('lineId');
        Route::delete('/booking/cart/lines/{lineId}/photos', [BookingCartController::class, 'deleteLinePhoto'])->whereNumber('lineId');

        Route::post('/booking/checkout', [BookingCheckoutController::class, 'checkout']);
        Route::get('/bookings/{bookingId}/payment-summary', [BookingCheckoutController::class, 'paymentSummary'])->whereNumber('bookingId');
        Route::get('/bookings/{bookingId}/confirmation', [BookingCheckoutController::class, 'confirmationSummary'])->whereNumber('bookingId');
        Route::get('/bookings/{bookingId}/track', [BookingTrackController::class, 'track'])->whereNumber('bookingId');
        Route::get('/bookings/{bookingId}', [BookingCheckoutController::class, 'customerDetail'])->whereNumber('bookingId');
        Route::post('/booking/apply-coupon', [BookingCheckoutController::class, 'applyCouponToLocks']);
        Route::post('/booking/cart/apply-coupon', [BookingCheckoutController::class, 'applyCouponToLocks']);
        Route::get('/coupons', [PromotionController::class, 'couponsList']);

        Route::post('/payment/create-order', [PaymentController::class, 'createOrder']);
        Route::post('/payment/verify', [PaymentController::class, 'verify']);
        Route::get('/payment/status', [PaymentController::class, 'statusGet']);
        Route::post('/payment/status', [PaymentController::class, 'statusPost']);
        Route::get('/payment/processing-state', [PaymentController::class, 'processingState']);
        Route::post('/payment/retry', [PaymentController::class, 'createOrder']);
        if (app()->environment('local') && env('PAYMENT_MODE') === 'mock') {
            Route::post('/payment/instant-confirm', [PaymentController::class, 'instantConfirm']);
        }
    });

    Route::post('/payment/webhook', [PaymentController::class, 'webhook']);
    if (! (app()->environment('local') && env('PAYMENT_MODE') === 'mock')) {
        Route::post('/payment/instant-confirm', fn () => response()->json(['status' => false, 'message' => 'Not available in production'], 403));
    }

    // Public / guest-accessible discovery endpoints (no auth in Node).
    Route::get('/payment/methods', [PaymentController::class, 'methodsCatalog']);
    Route::get('/service-category/home', [ServiceDiscoveryController::class, 'homeCategories']);
    Route::get('/promotions/home/carousel', [PromotionController::class, 'carousel']);
    Route::get('/promotions/home/offers', [PromotionController::class, 'offers']);
    Route::get('/services/popular', [ServiceDiscoveryController::class, 'popular']);
    Route::get('/services/emergency', [ServiceDiscoveryController::class, 'emergency']);
    Route::get('/services/quick', [ServiceDiscoveryController::class, 'quick']);
    Route::get('/services/instant', [ServiceDiscoveryController::class, 'instant']);
    Route::get('/services/one-click', [ServiceDiscoveryController::class, 'oneClick']);
    Route::get('/services/{serviceId}/type-flags', [ServiceDiscoveryController::class, 'typeFlags'])->whereNumber('serviceId');
    Route::post('/services/details', [ServiceDiscoveryController::class, 'serviceDetails']);
    Route::get('/check-serviceability', [ServiceDiscoveryController::class, 'checkServiceability']);
    Route::get('/service_search', [ServiceDiscoveryController::class, 'search'])->middleware('customer.optional');
});

Route::prefix('technician')->name('technician.')->group(function () {
    Route::post('/send-otp', [TechnicianOtpController::class, 'sendOtp'])->name('send-otp');
    Route::post('/verify-otp', [TechnicianOtpController::class, 'verifyOtp'])->name('verify-otp');
    Route::get('/required-document-list', [\App\Http\Controllers\TechnicianRegistrationController::class, 'requiredDocumentList']);

    Route::middleware(['auth:sanctum', 'technician.token'])->group(function () {
        Route::get('/me', fn (Request $request) => $request->user());

        Route::post('/booking/{booking}/start-service', [TechnicianBookingController::class, 'startService']);
        Route::post('/booking/{booking}/complete-service', [TechnicianBookingController::class, 'completeService']);
        Route::post('/booking/{booking}/reject', [TechnicianBookingController::class, 'reject']);

        Route::post('/auth/logout-all', [\App\Http\Controllers\TechnicianProfileController::class, 'logoutAll']);

        // Registration wizard
        Route::get('/registration/status', [\App\Http\Controllers\TechnicianRegistrationController::class, 'status']);
        Route::get('/registration/services', [\App\Http\Controllers\TechnicianRegistrationController::class, 'services']);
        Route::get('/registration/skills', [\App\Http\Controllers\TechnicianRegistrationController::class, 'skillsList']);
        Route::post('/registration/basic-details', [\App\Http\Controllers\TechnicianRegistrationController::class, 'basicDetails']);
        Route::post('/registration/skills', [\App\Http\Controllers\TechnicianRegistrationController::class, 'saveSkills']);
        Route::post('/registration/upload-document', [\App\Http\Controllers\TechnicianRegistrationController::class, 'uploadDocument']);
        Route::post('/registration/upload-selfie', [\App\Http\Controllers\TechnicianRegistrationController::class, 'uploadSelfie']);
        Route::post('/registration/bank-details', [\App\Http\Controllers\TechnicianRegistrationController::class, 'bankDetails']);
        Route::post('/registration/submit', [\App\Http\Controllers\TechnicianRegistrationController::class, 'submit']);
        Route::post('/registration/resubmit-corrections', [\App\Http\Controllers\TechnicianRegistrationController::class, 'resubmitCorrections']);
        Route::post('/registration/verify-upi', [\App\Http\Controllers\TechnicianRegistrationController::class, 'verifyUpiId']);
        Route::post('/registration/upi-verification-order', [\App\Http\Controllers\TechnicianRegistrationController::class, 'upiVerificationOrder']);
        Route::post('/registration/confirm-upi-payment', [\App\Http\Controllers\TechnicianRegistrationController::class, 'confirmUpiPayment']);

        // Home dashboard
        Route::get('/home/dashboard', [\App\Http\Controllers\TechnicianHomeController::class, 'dashboard']);
        Route::patch('/home/availability', [\App\Http\Controllers\TechnicianHomeController::class, 'setAvailability']);
        Route::get('/home/notifications/unread-count', [\App\Http\Controllers\TechnicianHomeController::class, 'unreadNotifications']);
        Route::get('/home/my-jobs', [\App\Http\Controllers\TechnicianHomeController::class, 'myJobs']);
        Route::get('/home/my-earnings', [\App\Http\Controllers\TechnicianHomeController::class, 'myEarnings']);
        Route::post('/home/withdraw-request', [\App\Http\Controllers\TechnicianHomeController::class, 'requestWithdrawal']);
        Route::get('/home/jobs/{bookingId}', [\App\Http\Controllers\TechnicianHomeController::class, 'jobDetail'])->whereNumber('bookingId');
        Route::post('/home/jobs/skip', [\App\Http\Controllers\TechnicianHomeController::class, 'skipJob']);
        Route::post('/home/jobs/accept', [\App\Http\Controllers\TechnicianHomeController::class, 'acceptJob']);
        Route::patch('/home/jobs/{bookingId}/status', [\App\Http\Controllers\TechnicianHomeController::class, 'updateJobStatus'])->whereNumber('bookingId');
        Route::post('/home/device/register', [\App\Http\Controllers\TechnicianHomeController::class, 'registerDevice']);
        Route::post('/home/location/update', [\App\Http\Controllers\TechnicianHomeController::class, 'updateLocation']);
        Route::patch('/home/location', [\App\Http\Controllers\TechnicianHomeController::class, 'updateLocation']);
        Route::post('/home/address', [\App\Http\Controllers\TechnicianHomeController::class, 'upsertAddress']);
        Route::patch('/home/address', [\App\Http\Controllers\TechnicianHomeController::class, 'upsertAddress']);

        // Profile
        Route::get('/profile', [\App\Http\Controllers\TechnicianProfileController::class, 'show']);
        Route::post('/update-profile', [\App\Http\Controllers\TechnicianProfileController::class, 'update']);
        Route::post('/update-bank', [\App\Http\Controllers\TechnicianProfileController::class, 'updateBank']);

        // Referral
        Route::get('/referral', [\App\Http\Controllers\TechnicianProfileController::class, 'referral']);
        Route::post('/referral/apply', [\App\Http\Controllers\TechnicianProfileController::class, 'applyReferral']);
    });
});

// Bare /booking/* prefix — mirrors Node's app.use('/booking', bookingRoutes) mount
// path exactly (distinct from /customer/booking and /technician/booking above).
// Node's own PaymentController.handleWebhook route has no auth (gateway calls it
// directly), so it's registered outside the admin.token-gated group below.
Route::post('/booking/payment/webhook', [AdminBookingController::class, 'paymentWebhook']);

Route::prefix('booking')->middleware(['auth:sanctum', 'admin.token'])->group(function () {
    Route::get('/all', [AdminBookingController::class, 'all']);
    Route::get('/{id}/commission-snapshot', [AdminBookingController::class, 'commissionSnapshot'])->whereNumber('id');
    Route::get('/{id}', [AdminBookingController::class, 'show'])->whereNumber('id');
    Route::post('/admin-paginated', [AdminBookingController::class, 'paginated']);
    Route::post('/admin-assignments', [AdminBookingController::class, 'assignments']);
    Route::post('/refund', [AdminBookingController::class, 'refund']);
    Route::post('/confirm', [AdminBookingController::class, 'confirm']);
    Route::post('/assign-technician', [AdminBookingController::class, 'assignTechnician']);
});
