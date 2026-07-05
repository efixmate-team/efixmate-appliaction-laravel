<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Direct port of internalApiKey.middleware.js's requireInternalApiKey — gates the geo module's internal endpoints. */
class EnsureInternalApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-Internal-Api-Key');
        $expected = config('services.internal_api_key');

        if (! $expected || ! $key || ! hash_equals($expected, $key)) {
            return response()->json(['status' => false, 'message' => 'Invalid internal API key'], 403);
        }

        return $next($request);
    }
}
