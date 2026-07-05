<?php

namespace App\Http\Middleware;

use Closure;
use Efixmate\Domain\Models\ActivityLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Direct port of activityLog.middleware.js + activityLog.service.js. Uses
 * Laravel's terminate() hook (runs after the response is already sent to the
 * client) as the equivalent of Node's res.on('finish') fire-and-forget pattern.
 */
class LogActivity
{
    private const ACTOR_TYPES = ['ADMIN', 'CUSTOMER', 'TECHNICIAN'];

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (env('ENABLE_ACTIVITY_LOG') === 'false') return;

        $path = $request->path();
        if ($request->method() === 'OPTIONS' || str_starts_with($path, 'uploads') || $path === 'health') {
            return;
        }

        [$actorType, $actorId] = $this->resolveActor($request->user());

        try {
            ActivityLog::create([
                'actor_type' => $actorType,
                'actor_id' => $actorId,
                'http_method' => substr($request->method(), 0, 10),
                'request_path' => substr('/'.$path, 0, 8000),
                'status_code' => $response->getStatusCode(),
                'ip_address' => substr((string) $request->ip(), 0, 45),
                'user_agent' => substr((string) $request->userAgent(), 0, 4000),
                'summary' => substr("{$request->method()} /{$path}", 0, 500),
                'metadata' => ['route' => $request->route()?->uri()],
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            // non-fatal — matches Node's .catch(console.error) on the insert
        }
    }

    /** @return array{0: ?string, 1: ?int} */
    private function resolveActor(mixed $user): array
    {
        if (! $user) return [null, null];

        if (isset($user->admin_id)) return ['ADMIN', (int) $user->admin_id];
        if (isset($user->customer_id)) return ['CUSTOMER', (int) $user->customer_id];
        if (isset($user->technician_id)) return ['TECHNICIAN', (int) $user->technician_id];

        return [null, null];
    }
}
