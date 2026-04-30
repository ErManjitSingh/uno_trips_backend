<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tour_package_id',
        'package_id',
        'name',
        'rating',
        'title',
        'service_rating',
        'value_rating',
        'location_rating',
        'cleanliness_rating',
        'review',
        'pros',
        'cons',
        'travel_date',
        'trip_type',
        'images',
        'status',
        'is_approved',
        'is_verified_booking',
        'is_featured',
        'helpful_count',
        'spam_score',
        'admin_reply',
        'admin_reply_by',
        'admin_reply_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_approved' => 'boolean',
            'service_rating' => 'integer',
            'value_rating' => 'integer',
            'location_rating' => 'integer',
            'cleanliness_rating' => 'integer',
            'travel_date' => 'date',
            'images' => 'array',
            'is_verified_booking' => 'boolean',
            'is_featured' => 'boolean',
            'helpful_count' => 'integer',
            'spam_score' => 'integer',
            'admin_reply_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(TourPackage::class, 'tour_package_id');
    }

    public function repliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_reply_by');
    }
}
