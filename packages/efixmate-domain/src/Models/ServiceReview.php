<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class ServiceReview extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_service_reviews';
    protected $primaryKey = 'review_id';
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'service_id',
        'booking_id',
        'rating',
        'comment',
        'image_urls',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'review_id' => 'integer',
        'customer_id' => 'integer',
        'service_id' => 'integer',
        'booking_id' => 'integer',
        'rating' => 'integer',
        'image_urls' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
