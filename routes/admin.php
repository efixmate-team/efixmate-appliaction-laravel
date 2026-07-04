<?php

use App\Http\Controllers\Admin\BookingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Admin/Dashboard', [
        'admin' => auth()->user()->only(['admin_id', 'first_name', 'last_name', 'email', 'admin_type']),
    ]))->name('dashboard');

    Route::middleware('permission:BOOKING_MANAGE')
        ->prefix('booking-management/bookings')
        ->name('booking-management.bookings.')
        ->group(function () {
            Route::get('/', [BookingController::class, 'index'])->name('index');
            Route::get('/{booking}', [BookingController::class, 'show'])->name('show');
            Route::post('/{booking}/assign-technician', [BookingController::class, 'assignTechnician'])->name('assign-technician');
        });
});
