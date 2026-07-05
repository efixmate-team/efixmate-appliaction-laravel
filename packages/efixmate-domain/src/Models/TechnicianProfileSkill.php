<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianProfileSkill extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_profile_skills';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'service_id',
        'skill_level',
    ];

    protected $casts = [
        'id' => 'integer',
        'technician_id' => 'integer',
        'service_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
