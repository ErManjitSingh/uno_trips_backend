<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'destination',
        'phone',
        'source',
        'status',
        'message',
        'assigned_to',
        'follow_up_at',
        'notes_timeline',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_at' => 'datetime',
            'notes_timeline' => 'array',
        ];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
