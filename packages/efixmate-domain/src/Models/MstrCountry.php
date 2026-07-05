<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrCountry extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_countries';
    protected $primaryKey = 'country_id';
    public $timestamps = false;

    protected $fillable = [
        'country_name',
        'country_code',
        'dial_code',
        'currency_id',
        'is_active',
        'created_at',
        'updated_at',
        'language_ids',
        'timezone_ids',
    ];

    protected $casts = [
        'country_id' => 'integer',
        'currency_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'language_ids' => 'array',
        'timezone_ids' => 'array',
        'is_deleted' => 'boolean',
    ];
}
