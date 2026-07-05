<?php

namespace App\Http\Middleware;

use Closure;
use Efixmate\Domain\Models\Admin;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Admin-side analog of EnsureCustomerToken/EnsureTechnicianToken — see those for rationale. */
class EnsureAdminToken
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user() instanceof Admin, 401, 'Admin token required.');

        return $next($request);
    }
}
