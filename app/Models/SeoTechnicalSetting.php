<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoTechnicalSetting extends Model
{
    protected $fillable = [
        'lazy_load_enabled',
        'minify_assets_enabled',
        'sitemap_auto_generate',
        'robots_txt',
    ];

    protected function casts(): array
    {
        return [
            'lazy_load_enabled' => 'boolean',
            'minify_assets_enabled' => 'boolean',
            'sitemap_auto_generate' => 'boolean',
        ];
    }
}

