<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpLanguage extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_languages';
    protected $primaryKey = 'language_id';
    public $timestamps = false;

    protected $fillable = [
        'language_name',
        'language_code',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'language_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
