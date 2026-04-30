<?php

namespace Database\Factories;

use App\Models\GlobalSeoSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GlobalSeoSetting>
 */
class GlobalSeoSettingFactory extends Factory
{
    protected $model = GlobalSeoSetting::class;

    public function definition(): array
    {
        return [
            'site_name' => fake()->company(),
            'default_meta_title' => fake()->sentence(6),
            'default_meta_description' => fake()->sentence(18),
            'robots_txt' => "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml",
            'sitemap_auto' => true,
            'google_analytics_code' => 'G-XXXXXXXXXX',
        ];
    }
}

