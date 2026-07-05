<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerFavorite extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_favorites';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'entity_type',
        'entity_id',
        'created_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'customer_id' => 'integer',
        'entity_id' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
