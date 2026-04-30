<?php

namespace Database\Factories;

use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TourPackage>
 */
class TourPackageFactory extends Factory
{
    protected $model = TourPackage::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => $title,
            'description' => fake()->paragraph(),
            'slug' => Str::slug($title),
            'destination' => fake()->city(),
            'location' => fake()->city().', '.fake()->country(),
            'duration' => fake()->randomElement(['3D/2N', '5D/4N', '7D/6N']),
            'max_people' => fake()->numberBetween(2, 20),
            'price' => fake()->numberBetween(10000, 90000),
            'discount_price' => fake()->boolean(60) ? fake()->numberBetween(8000, 75000) : null,
            'status' => fake()->randomElement(['draft', 'published']),
            'featured' => fake()->boolean(20),
            'created_by' => User::factory(),
            'package_type' => fake()->randomElement(['domestic', 'international', 'honeymoon', 'family', 'adventure']),
        ];
    }
}

