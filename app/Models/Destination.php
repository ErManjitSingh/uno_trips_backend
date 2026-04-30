<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'state',
        'short_description',
        'description',
        'hero_image',
        'gallery',
        'is_featured',
        'seo_meta_title',
        'seo_meta_description',
    ];

    protected function casts(): array
    {
        return [
            'gallery' => 'array',
            'is_featured' => 'boolean',
        ];
    }
}
