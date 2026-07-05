<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LkpDocumentType extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_lkp_document_type';
    protected $primaryKey = 'document_type_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq',
        'document_type',
        'applies_to',
        'is_mandatory',
        'is_active',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'document_type_id' => 'integer',
        'order_seq' => 'integer',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
