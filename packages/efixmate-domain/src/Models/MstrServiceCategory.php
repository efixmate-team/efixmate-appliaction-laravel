<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrServiceCategory extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_service_category';
    protected $primaryKey = 'category_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq', 'category_name', 'category_code', 'description', 'is_active',
        'created_by', 'created_at', 'updated_by', 'updated_at', 'category_icon',
        'category_route', 'category_color',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'order_seq' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function services()
    {
        return $this->hasMany(MstrService::class, 'category_id', 'category_id');
    }
}
