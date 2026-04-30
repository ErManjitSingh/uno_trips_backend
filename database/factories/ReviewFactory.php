<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tour_package_id' => TourPackage::factory(),
            'package_id' => null,
            'name' => fake()->name(),
            'rating' => fake()->numberBetween(1, 5),
            'review' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
            'is_approved' => fake()->boolean(60),
        ];
    }
}

