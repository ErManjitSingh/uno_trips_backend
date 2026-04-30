<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoSocial extends Model
{
    protected $table = 'seo_social';

    protected $fillable = [
        'seo_meta_id',
        'og_title',
        'og_description',
        'og_image',
        'og_url',
        'twitter_title',
        'twitter_description',
        'twitter_image',
    ];

    public function seoMeta(): BelongsTo
    {
        return $this->belongsTo(SeoMeta::class);
    }
}

