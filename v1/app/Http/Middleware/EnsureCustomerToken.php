<?php

namespace App\Http\Middleware;

use Closure;
use Efixmate\Domain\Models\Customer;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A single Sanctum guard authenticates both Customer and Technician tokens
 * (Sanctum's personal_access_tokens table is polymorphic) — this middleware is the
 * practical analog of the source Node app's separate USER_JWT_SECRET, asserting the
 * authenticated token actually belongs to a Customer, not a Technician.
 */
class EnsureCustomerToken
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user() instanceof Customer, 401, 'Customer token required.');

        return $next($request);
    }
}
