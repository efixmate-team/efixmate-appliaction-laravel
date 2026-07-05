<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrSkill extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_skills';
    protected $primaryKey = 'skill_id';
    public $timestamps = false;

    protected $fillable = [
        'skill_name',
        'category_id',
        'description',
        'skill_icon',
        'skill_color',
        'order_seq',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'skill_id' => 'integer',
        'category_id' => 'integer',
        'order_seq' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
