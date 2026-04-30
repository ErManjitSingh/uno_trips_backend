<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlobalSeoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_name',
        'default_meta_title',
        'default_meta_description',
        'robots_txt',
        'sitemap_auto',
        'google_analytics_code',
    ];

    protected function casts(): array
    {
        return [
            'sitemap_auto' => 'boolean',
        ];
    }
}

