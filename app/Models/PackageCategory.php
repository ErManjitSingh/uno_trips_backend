<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'icon',
        'color',
        'description',
        'seo_title',
        'seo_description',
        'status',
        'featured',
        'parent_id',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'featured' => 'boolean',
            'parent_id' => 'integer',
            'position' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }
}
