<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Technician extends Model
{
    use HasApiTokens, HasIsDeletedFlag;

    protected $table = 'efm_technicians';
    protected $primaryKey = 'technician_id';
    public $timestamps = false;

    protected $fillable = [
        'first_name', 'last_name', 'mobile_number', 'email', 'profile_pitcher',
        'selfie_photo', 'status_id', 'is_selfie_verified', 'is_active', 'created_by',
        'created_at', 'updated_by', 'updated_at', 'category_id', 'sub_category_id',
        'current_jobs', 'max_jobs', 'application_status', 'application_reject_reason',
        'technician_unique_id', 'is_online', 'fcm_token', 'vacation_mode',
        'vacation_until', 'service_radius_km', 'geo_fence_enabled', 'referral_code',
        'referred_by_technician_id', 'availability_status', 'avg_rating', 'review_count',
    ];

    protected $casts = [
        'is_selfie_verified' => 'boolean',
        'is_active' => 'boolean',
        'is_online' => 'boolean',
        'vacation_mode' => 'boolean',
        'geo_fence_enabled' => 'boolean',
        'is_deleted' => 'boolean',
        'current_jobs' => 'integer',
        'max_jobs' => 'integer',
        'review_count' => 'integer',
        'service_radius_km' => 'decimal:2',
        'avg_rating' => 'decimal:2',
        'vacation_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function sessions()
    {
        return $this->hasMany(TechnicianSession::class, 'technician_id', 'technician_id');
    }

    public function bookingAssignments()
    {
        return $this->hasMany(BookingTechnician::class, 'technician_id', 'technician_id');
    }
}
