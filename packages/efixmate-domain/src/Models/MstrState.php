<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrState extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_states';
    protected $primaryKey = 'state_id';
    public $timestamps = false;

    protected $fillable = [
        'country_id',
        'state_name',
        'state_code',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'state_id' => 'integer',
        'country_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
