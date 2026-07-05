<?php

namespace App\Http\Middleware;

use Closure;
use Efixmate\Domain\Models\Customer;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Direct port of user.routes.js's optionalAuthenticateUser: if a valid Bearer token
 * is present, populate $request->user(); otherwise continue as guest rather than
 * aborting (used for address-scoped promotions/search that also work for guests).
 */
class OptionalCustomerAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken && $accessToken->tokenable instanceof Customer) {
                $request->setUserResolver(fn () => $accessToken->tokenable);
            }
        }

        return $next($request);
    }
}
