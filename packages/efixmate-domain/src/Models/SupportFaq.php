<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class SupportFaq extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_support_faqs';
    protected $primaryKey = 'faq_id';
    public $timestamps = false;

    protected $fillable = [
        'category',
        'question',
        'answer',
        'sort_order',
        'is_active',
        'audience',
    ];

    protected $casts = [
        'faq_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
    ];
}
