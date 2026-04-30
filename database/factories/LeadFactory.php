<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'destination' => fake()->city(),
            'message' => fake()->sentence(12),
            'status' => fake()->randomElement(['new', 'contacted', 'converted']),
            'assigned_to' => User::factory(),
            'source' => fake()->randomElement(['website', 'ads', 'social']),
        ];
    }
}

