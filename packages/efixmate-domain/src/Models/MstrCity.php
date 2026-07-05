<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrCity extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_cities';
    protected $primaryKey = 'city_id';
    public $timestamps = false;

    protected $fillable = [
        'state_id',
        'city_name',
        'is_active',
        'created_at',
        'updated_at',
        'slug',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'city_id' => 'integer',
        'state_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
