<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_feedbacks';
    protected $primaryKey = 'feedback_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'rating',
        'comment',
        'status',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'feedback_id' => 'integer',
        'user_id' => 'integer',
        'rating' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
