<?php

namespace App\Models;

use Efixmate\Domain\Models\Admin as BaseAdmin;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;

/**
 * Adds session-guard login capability on top of the shared package's plain data
 * model. Kept out of the shared package so it stays guard-agnostic (v1 never
 * authenticates admins).
 */
class Admin extends BaseAdmin implements AuthenticatableContract
{
    use Authenticatable;

    /** No remember_token column on efm_admins — disable remember-me token handling. */
    public function getRememberTokenName()
    {
        return '';
    }
}
