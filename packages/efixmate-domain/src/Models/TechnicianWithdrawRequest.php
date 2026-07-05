<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianWithdrawRequest extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_withdraw_requests';
    protected $primaryKey = 'request_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'amount',
        'status',
        'remark',
        'country_id',
        'state_id',
        'city_id',
        'area_id',
        'fy_id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'request_id' => 'integer',
        'technician_id' => 'integer',
        'amount' => 'decimal:2',
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
