<?php

namespace App\Http\Middleware;

use App\Support\StepUpToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Direct port of requireStepUp.middleware.js — gates sensitive admin mutations. */
class RequireStepUp
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Step-Up-Token');
        $adminId = $request->user()?->admin_id;

        if (! $adminId || ! StepUpToken::verify($token, $adminId)) {
            return response()->json([
                'status' => false,
                'message' => 'Sensitive action confirmation required',
                'code' => 'STEP_UP_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
