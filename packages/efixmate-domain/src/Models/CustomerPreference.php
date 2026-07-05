<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerPreference extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_preferences';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = [
        'language_code',
        'theme',
        'updated_at',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
