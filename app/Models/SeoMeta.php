<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SeoMeta extends Model
{
    use HasFactory;

    protected $table = 'seo_meta';

    protected $fillable = [
        'entity_type',
        'entity_id',
        'page_key',
        'slug',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'canonical_url',
        'og_title',
        'og_description',
        'og_image',
        'og_url',
        'twitter_title',
        'twitter_description',
        'twitter_image',
        'robots_index',
        'robots_follow',
        'include_in_sitemap',
        'schema_type',
        'json_ld',
        'image_alt',
        'image_title',
        'image_file_name',
        'seoable_id',
        'seoable_type',
        'robots',
        'schema_json',
    ];

    protected function casts(): array
    {
        return [
            'robots_index' => 'boolean',
            'robots_follow' => 'boolean',
            'include_in_sitemap' => 'boolean',
            'schema_json' => 'array',
        ];
    }

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }

    public function social(): HasOne
    {
        return $this->hasOne(SeoSocial::class);
    }
}

