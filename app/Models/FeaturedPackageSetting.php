<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeaturedPackageSetting extends Model
{
    protected $fillable = [
        'max_featured',
        'auto_rotate',
    ];

    protected function casts(): array
    {
        return [
            'max_featured' => 'integer',
            'auto_rotate' => 'boolean',
        ];
    }
}
