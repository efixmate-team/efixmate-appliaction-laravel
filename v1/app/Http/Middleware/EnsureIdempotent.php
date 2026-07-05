<?php

namespace App\Http\Middleware;

use App\Support\IdempotencyKeyDerivers;
use Closure;
use Efixmate\Domain\Models\IdempotencyKey;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Direct port of server/src/middleware/idempotency.middleware.js's two exports.
 * Usage: ->middleware('idempotent:booking.checkout,checkout') for the
 * "financial" mode (header OR derived body key required, 400 otherwise) or
 * ->middleware('idempotent:some.route') alone for the optional mode (only
 * dedupes when a client actually sends an Idempotency-Key header).
 *
 * @param string $routeKey stable identifier for this endpoint, used to namespace cache keys
 * @param string|null $deriver method name on IdempotencyKeyDerivers; presence makes this "financial" mode
 */
class EnsureIdempotent
{
    private const TTL_HOURS = 24;

    public function handle(Request $request, Closure $next, string $routeKey, ?string $deriver = null): Response
    {
        $headerKey = $request->header('Idempotency-Key');
        $bodyKey = $deriver ? IdempotencyKeyDerivers::{$deriver}($request) : null;

        if ($deriver && ! $headerKey && ! $bodyKey) {
            return response()->json([
                'status' => false,
                'message' => 'Idempotency-Key header or stable request fields required for this operation.',
            ], 400);
        }

        if (! $headerKey && ! $bodyKey) {
            return $next($request);
        }

        $composite = $headerKey ? "{$routeKey}:hdr:{$headerKey}" : "{$routeKey}:body:{$bodyKey}";

        $cached = IdempotencyKey::where('idempotency_key', $composite)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return response()->json($cached->response_body, $cached->response_status ?: 200);
        }

        $request->attributes->set('idempotency_key', $composite);

        $response = $next($request);

        if ($response instanceof JsonResponse) {
            try {
                IdempotencyKey::updateOrCreate(
                    ['idempotency_key' => $composite],
                    [
                        'route' => $routeKey,
                        'response_status' => $response->getStatusCode(),
                        'response_body' => $response->getData(true),
                        'created_at' => now(),
                        'expires_at' => now()->addHours(self::TTL_HOURS),
                    ],
                );
            } catch (\Throwable) {
                // non-fatal — matches Node's .catch(() => {}) on the INSERT
            }
        }

        return $response;
    }
}
