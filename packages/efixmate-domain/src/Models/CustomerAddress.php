<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_customer_address';
    protected $primaryKey = 'address_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id', 'address', 'city', 'state', 'country', 'pincode', 'latitude',
        'longitude', 'area_id', 'is_active', 'created_by', 'created_at', 'updated_by',
        'updated_at', 'is_selected', 'address_type', 'house_no', 'landmark',
        'contact_name', 'contact_phone',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_selected' => 'boolean',
        'is_deleted' => 'boolean',
        'pincode' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}
