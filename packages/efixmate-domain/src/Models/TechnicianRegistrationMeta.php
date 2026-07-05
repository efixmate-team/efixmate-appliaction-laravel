<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianRegistrationMeta extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_registration_meta';
    protected $primaryKey = 'technician_id';
    public $timestamps = false;

    protected $fillable = [
        'pan_number',
        'pan_verified',
        'aadhaar_number',
        'aadhaar_verified',
        'emergency_contact',
        'experience_years',
        'experience_details',
        'languages',
        'certificates',
        'profile_video_url',
        'updated_at',
    ];

    protected $casts = [
        'technician_id' => 'integer',
        'pan_verified' => 'boolean',
        'aadhaar_verified' => 'boolean',
        'emergency_contact' => 'array',
        'experience_years' => 'integer',
        'languages' => 'array',
        'certificates' => 'array',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
