<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer',
        'email',
        'package_name',
        'guests',
        'amount',
        'booking_status',
        'customer_id',
        'user_id',
        'tour_package_id',
        'package_id',
        'booking_date',
        'travel_date',
        'persons',
        'traveler_count',
        'total_amount',
        'status',
        'payment_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'travel_date' => 'date',
            'persons' => 'integer',
            'guests' => 'integer',
            'traveler_count' => 'integer',
            'amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(TourPackage::class, 'tour_package_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
