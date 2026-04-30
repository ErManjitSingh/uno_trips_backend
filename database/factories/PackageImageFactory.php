<?php

namespace Database\Factories;

use App\Models\PackageImage;
use App\Models\TourPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PackageImage>
 */
class PackageImageFactory extends Factory
{
    protected $model = PackageImage::class;

    public function definition(): array
    {
        return [
            'tour_package_id' => TourPackage::factory(),
            'image' => 'packages/'.fake()->uuid().'.jpg',
            'alt_text' => fake()->sentence(6),
            'title' => fake()->sentence(3),
            'is_featured' => fake()->boolean(20),
        ];
    }
}

