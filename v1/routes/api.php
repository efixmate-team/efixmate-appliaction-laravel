<?php

use App\Http\Controllers\Auth\CustomerOtpController;
use App\Http\Controllers\Auth\TechnicianOtpController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\TechnicianBookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

Route::prefix('technician')->name('technician.')->group(function () {
    Route::post('/send-otp', [TechnicianOtpController::class, 'sendOtp'])->name('send-otp');
    Route::post('/verify-otp', [TechnicianOtpController::class, 'verifyOtp'])->name('verify-otp');

    Route::middleware(['auth:sanctum', 'technician.token'])->group(function () {
        Route::get('/me', fn (Request $request) => $request->user());

        Route::post('/booking/{booking}/start-service', [TechnicianBookingController::class, 'startService']);
        Route::post('/booking/{booking}/complete-service', [TechnicianBookingController::class, 'completeService']);
    });
});
