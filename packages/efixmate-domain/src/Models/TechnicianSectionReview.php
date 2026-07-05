<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianSectionReview extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_section_reviews';
    protected $primaryKey = 'review_id';
    public $timestamps = false;

    protected $fillable = [
        'technician_id',
        'section',
        'status',
        'remark',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'review_id' => 'integer',
        'technician_id' => 'integer',
        'reviewed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
