<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LegacyApiController extends Controller
{
    public function handle(Request $request, ?string $legacyPath = null): JsonResponse
    {
        $path = trim($legacyPath ?? $request->path(), '/');
        $module = explode('/', $path)[0] ?: 'root';

        return response()->json([
            'status' => false,
            'migration_status' => 'pending',
            'message' => 'This legacy Node.js endpoint is reserved in Laravel v1 but has not been fully ported yet.',
            'method' => $request->method(),
            'path' => '/' . $path,
            'module' => $module,
        ], 501);
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'eFixMate Laravel v1',
            'database' => 'not_checked',
        ]);
    }
}
