<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

/**
 * Plain data model — deliberately does not implement Authenticatable here so this
 * shared package stays guard-agnostic. The outer (Inertia) app's app/Models/Admin.php
 * extends this and adds Authenticatable for session-guard login (see the foundation
 * phase's Stage 4). HasApiTokens is added here (rather than only in a v1 subclass)
 * so v1 can issue Sanctum tokens for admin-gated API parity routes (see Stage 1/6
 * of the full-server-parity plan) without needing a second Admin model.
 */
class Admin extends Model
{
    use HasApiTokens, HasIsDeletedFlag;

    protected $table = 'efm_admins';
    protected $primaryKey = 'admin_id';
    public $timestamps = false;

    protected $fillable = [
        'admin_uid', 'admin_code', 'first_name', 'last_name', 'mobile_number', 'email',
        'password', 'secret_key', 'admin_type', 'email_verified', 'mobile_verified',
        'is_active', 'totp_enabled', 'totp_secret_encrypted', 'failed_login_count',
        'locked_until', 'created_by', 'created_at', 'updated_by', 'updated_at',
        'role_id', 'role_active', 'profile_image',
    ];

    protected $hidden = ['password', 'secret_key', 'totp_secret_encrypted'];

    protected $casts = [
        'email_verified' => 'boolean',
        'mobile_verified' => 'boolean',
        'is_active' => 'boolean',
        'totp_enabled' => 'boolean',
        'role_active' => 'boolean',
        'is_deleted' => 'boolean',
        'failed_login_count' => 'integer',
        'locked_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function role()
    {
        return $this->belongsTo(AdminRole::class, 'role_id', 'role_id');
    }

    public function sessions()
    {
        return $this->hasMany(AdminSession::class, 'admin_id', 'admin_id');
    }
}
