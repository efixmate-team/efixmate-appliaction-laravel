<?php

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        then: function () {
            Illuminate\Support\Facades\Route::middleware('api')
                ->prefix('api')
                ->group(__DIR__.'/../routes/legacy.php');
            Illuminate\Support\Facades\Route::middleware('api')
                ->group(__DIR__.'/../routes/legacy.php');
            Illuminate\Support\Facades\Route::middleware('web')
                ->group(__DIR__.'/../routes/legacy.php');
        },
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [
            \App\Http\Middleware\LogActivity::class,
        ]);
        $middleware->alias([
            'customer.token' => \App\Http\Middleware\EnsureCustomerToken::class,
            'technician.token' => \App\Http\Middleware\EnsureTechnicianToken::class,
            'admin.token' => \App\Http\Middleware\EnsureAdminToken::class,
            'idempotent' => \App\Http\Middleware\EnsureIdempotent::class,
            'step-up' => \App\Http\Middleware\RequireStepUp::class,
            'customer.optional' => \App\Http\Middleware\OptionalCustomerAuth::class,
        ]);

        // API-only app has no named "login" route; without this, unauthenticated
        // requests that don't send Accept: application/json crash with a 500
        // (RouteNotFoundException) instead of a clean 401 JSON response.
        Authenticate::redirectUsing(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();

