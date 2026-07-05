<?php

use App\Http\Controllers\Auth\AdminLoginController;
use App\Http\Controllers\Auth\TwoFactorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('ClientPage', [
    'title' => 'Home',
    'source' => 'client/app/(public)/(landing)/page.tsx',
    'area' => 'public',
    'path' => '/',
    'params' => [],
]));

Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AdminLoginController::class, 'create'])->name('login');
    Route::get('/login/{admin_uid}', [AdminLoginController::class, 'createWithUid'])->name('login.magic-link');
    Route::post('/admin/login', [AdminLoginController::class, 'store']);
    Route::post('/check-uid', [AdminLoginController::class, 'checkUid'])
        ->middleware('throttle:5,1');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AdminLoginController::class, 'destroy'])->name('logout');
    Route::post('/2fa/enable', [TwoFactorController::class, 'enable'])->name('2fa.enable');
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm'])->name('2fa.confirm');
});
