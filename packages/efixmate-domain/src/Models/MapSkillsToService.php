<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MapSkillsToService extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_map_skills_to_services';
    protected $primaryKey = 'map_id';
    public $timestamps = false;

    protected $fillable = [
        'skill_id',
        'service_id',
    ];

    protected $casts = [
        'map_id' => 'integer',
        'skill_id' => 'integer',
        'service_id' => 'integer',
        'is_deleted' => 'boolean',
    ];
}
