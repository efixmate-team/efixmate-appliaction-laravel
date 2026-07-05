<?php

namespace Efixmate\Domain\Models;

use Illuminate\Database\Eloquent\Model;

class TrackerMarketingSpend extends Model
{
    protected $table = 'efm_tracker_marketing_spend';
    protected $primaryKey = 'spend_id';
    public $timestamps = false;

    protected $fillable = [
        'period_month',
        'channel',
        'spend',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'spend_id' => 'integer',
        'period_month' => 'datetime',
        'spend' => 'decimal:2',
        'created_at' => 'datetime',
    ];
}
