<?php

use App\Http\Controllers\Auth\AdminLoginController;
use App\Http\Controllers\Auth\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route(auth()->check() ? 'admin.dashboard' : 'login'));

Route::middleware('guest')->group(function () {
    Route::get('/login', [AdminLoginController::class, 'create'])->name('login');
    Route::post('/login', [AdminLoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AdminLoginController::class, 'destroy'])->name('logout');
    Route::post('/2fa/enable', [TwoFactorController::class, 'enable'])->name('2fa.enable');
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm'])->name('2fa.confirm');
});
