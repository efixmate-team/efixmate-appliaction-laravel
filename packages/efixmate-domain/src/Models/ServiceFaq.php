<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class ServiceFaq extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_service_faqs';
    protected $primaryKey = 'faq_id';
    public $timestamps = false;

    protected $fillable = [
        'service_id',
        'question',
        'answer',
        'sort_order',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'faq_id' => 'integer',
        'service_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
