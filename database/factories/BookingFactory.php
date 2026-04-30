<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tour_package_id' => TourPackage::factory(),
            'package_id' => null,
            'booking_date' => fake()->dateTimeBetween('-10 days', 'now'),
            'travel_date' => fake()->dateTimeBetween('+7 days', '+4 months'),
            'persons' => fake()->numberBetween(1, 8),
            'total_amount' => fake()->numberBetween(12000, 200000),
            'booking_status' => fake()->randomElement(['pending', 'confirmed', 'cancelled']),
            'payment_status' => fake()->randomElement(['paid', 'unpaid']),
        ];
    }
}

