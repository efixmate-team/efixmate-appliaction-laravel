<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmCustomerNote extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_customer_notes';
    protected $primaryKey = 'note_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'note',
        'is_pinned',
        'created_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'note_id' => 'integer',
        'customer_id' => 'integer',
        'is_pinned' => 'boolean',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
