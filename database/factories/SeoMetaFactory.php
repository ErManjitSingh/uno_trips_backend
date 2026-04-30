<?php

namespace Database\Factories;

use App\Models\SeoMeta;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SeoMeta>
 */
class SeoMetaFactory extends Factory
{
    protected $model = SeoMeta::class;

    public function definition(): array
    {
        $title = fake()->sentence(6);

        return [
            'meta_title' => $title,
            'meta_description' => fake()->sentence(20),
            'meta_keywords' => implode(', ', fake()->words(5)),
            'slug' => Str::slug($title),
            'canonical_url' => fake()->url(),
            'robots' => fake()->randomElement(['index,follow', 'noindex,nofollow']),
        ];
    }
}

