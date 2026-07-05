<?php

namespace App\Providers;

use App\Contracts\SmsGateway;
use App\Services\LogSmsGateway;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\Technician;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SmsGateway::class, LogSmsGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Sanctum's tokenable_type stores whichever class name mints the token. The
        // outer Inertia app mints admin tokens via its own App\Models\Admin subclass
        // (see AdminLoginController's v1-bridge token) — that class doesn't exist in
        // this process, so without a morph map the polymorphic lookup fails here.
        // A shared alias, registered identically in both apps, lets each process
        // resolve to its own local class for the same underlying efm_admins row.
        Relation::enforceMorphMap([
            'admin' => \Efixmate\Domain\Models\Admin::class,
            'customer' => Customer::class,
            'technician' => Technician::class,
        ]);
    }
}
