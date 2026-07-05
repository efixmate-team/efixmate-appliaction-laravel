<?php

use App\Http\Controllers\LegacyApiController;
use Illuminate\Support\Facades\Route;

$legacyPrefixes = [
    'admin',
    'user',
    'technician',
    'booking',
    'lookup',
    'master',
    'pricing',
    'public',
    'webapp',
];

Route::get('/health', [LegacyApiController::class, 'health']);
Route::match(['POST'], '/check-uid', [LegacyApiController::class, 'handle']);
Route::match(['POST'], '/logout', [LegacyApiController::class, 'handle']);
Route::match(['GET'], '/metrics', [LegacyApiController::class, 'handle']);
Route::match(['GET', 'POST'], '/areas', [LegacyApiController::class, 'handle']);
Route::match(['POST'], '/assign-technician', [LegacyApiController::class, 'handle']);

foreach ($legacyPrefixes as $prefix) {
    Route::any("/$prefix", [LegacyApiController::class, 'handle'])->defaults('legacyPath', $prefix);
    Route::any("/$prefix/{legacyPath}", [LegacyApiController::class, 'handle'])->where('legacyPath', '.*');
}
