<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_invoices';
    protected $primaryKey = 'invoice_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'invoice_number',
        'amount',
        'status',
        'taxable_amount',
        'gst_amount',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'gst_rate',
        'customer_id',
        'payment_id',
        'pdf_meta',
        'generated_by',
        'is_active',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'invoice_id' => 'integer',
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_amount' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'customer_id' => 'integer',
        'payment_id' => 'integer',
        'pdf_meta' => 'array',
        'generated_by' => 'integer',
        'is_active' => 'boolean',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'fy_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
