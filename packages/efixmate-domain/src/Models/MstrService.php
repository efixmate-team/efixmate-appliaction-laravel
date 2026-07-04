<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class MstrService extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_mstr_services';
    protected $primaryKey = 'service_id';
    public $timestamps = false;

    protected $fillable = [
        'order_seq', 'category_id', 'service', 'service_code', 'description',
        'is_active', 'created_by', 'created_at', 'updated_by', 'updated_at',
        'base_price', 'duration', 'base_duration', 'image_url', 'video_url',
        'service_icon', 'service_color', 'slug', 'meta_title', 'meta_description',
        'booking_type_ids', 'unit_ids', 'charge_ids', 'avg_rating', 'review_count',
        'is_emergency', 'is_quick_service', 'is_instant_service', 'is_one_click_service',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'is_emergency' => 'boolean',
        'is_quick_service' => 'boolean',
        'is_instant_service' => 'boolean',
        'is_one_click_service' => 'boolean',
        'order_seq' => 'integer',
        'review_count' => 'integer',
        'base_price' => 'decimal:2',
        'avg_rating' => 'decimal:2',
        'booking_type_ids' => 'array',
        'unit_ids' => 'array',
        'charge_ids' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(MstrServiceCategory::class, 'category_id', 'category_id');
    }
}
