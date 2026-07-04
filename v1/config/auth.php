<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This is a stateless, API-only app — no session/password-reset guard is
    | configured. The 'sanctum' guard is registered by laravel/sanctum itself and
    | resolves the authenticated Customer or Technician from the token's
    | polymorphic tokenable relation (see EnsureCustomerToken/EnsureTechnicianToken).
    |
    */

    'defaults' => [
        'guard' => 'sanctum',
        'passwords' => null,
    ],

    'guards' => [],

    'providers' => [],

    'passwords' => [],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
