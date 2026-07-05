<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class LogPayment extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_log_payments';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'payment_id',
        'gateway_type',
        'amount',
        'currency',
        'status',
        'gateway_res',
        'webhook_event',
        'attempt_no',
        'created_at',
    ];

    protected $casts = [
        'log_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'gateway_res' => 'array',
        'attempt_no' => 'integer',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
