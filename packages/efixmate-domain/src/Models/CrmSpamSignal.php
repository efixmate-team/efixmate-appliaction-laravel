<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CrmSpamSignal extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_crm_spam_signals';
    protected $primaryKey = 'signal_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'signal_type',
        'score_delta',
        'details',
        'created_at',
    ];

    protected $casts = [
        'signal_id' => 'integer',
        'customer_id' => 'integer',
        'score_delta' => 'integer',
        'details' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
