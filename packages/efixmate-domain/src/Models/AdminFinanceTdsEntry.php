<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class AdminFinanceTdsEntry extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_admin_finance_tds_entries';
    protected $primaryKey = 'tds_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'payment_id',
        'technician_id',
        'payout_id',
        'fy_id',
        'gross_amount',
        'tds_rate',
        'tds_amount',
        'section_code',
        'financial_year',
        'period_month',
        'status',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'tds_id' => 'integer',
        'booking_id' => 'integer',
        'payment_id' => 'integer',
        'technician_id' => 'integer',
        'payout_id' => 'integer',
        'fy_id' => 'integer',
        'gross_amount' => 'decimal:2',
        'tds_rate' => 'decimal:2',
        'tds_amount' => 'decimal:2',
        'meta' => 'array',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
