<?php

namespace App\Providers;

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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Must match v1's AppServiceProvider morph map exactly — see that file's
        // comment. This app mints admin tokens (via App\Models\Admin, a local
        // subclass) that v1 must also be able to resolve, and vice versa.
        Relation::enforceMorphMap([
            'admin' => \App\Models\Admin::class,
            'customer' => Customer::class,
            'technician' => Technician::class,
        ]);
    }
}
