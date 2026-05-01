<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingPage extends Model
{
    protected $fillable = [
        'title',
        'banner_image',
        'banner_overlay_text',
        'slug',
        'page_type',
        'status',
        'publish_at',
        'listing_page_category_id',
        'filters_json',
        'packages_json',
        'content',
        'read_more',
        'tags',
        'seo_meta',
        'blogs_json',
        'internal_links_json',
        'filter_controls_json',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'canonical_url',
        'schema_json',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'filters_json' => 'array',
            'packages_json' => 'array',
            'tags' => 'array',
            'seo_meta' => 'array',
            'blogs_json' => 'array',
            'internal_links_json' => 'array',
            'filter_controls_json' => 'array',
            'publish_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ListingPageCategory::class, 'listing_page_category_id');
    }
}
