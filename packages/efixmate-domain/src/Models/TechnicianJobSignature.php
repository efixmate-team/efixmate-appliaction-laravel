<?php

namespace Efixmate\Domain\Models;

use Efixmate\Domain\Concerns\HasIsDeletedFlag;
use Illuminate\Database\Eloquent\Model;

class TechnicianJobSignature extends Model
{
    use HasIsDeletedFlag;

    protected $table = 'efm_technician_job_signatures';
    protected $primaryKey = 'signature_id';
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'technician_id',
        'signature_url',
        'signed_at',
    ];

    protected $casts = [
        'signature_id' => 'integer',
        'booking_id' => 'integer',
        'technician_id' => 'integer',
        'signed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];
}
