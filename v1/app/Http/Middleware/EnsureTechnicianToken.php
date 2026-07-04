<?php

namespace App\Http\Middleware;

use Closure;
use Efixmate\Domain\Models\Technician;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Technician-side analog of EnsureCustomerToken — see that class for rationale. */
class EnsureTechnicianToken
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user() instanceof Technician, 401, 'Technician token required.');

        return $next($request);
    }
}
