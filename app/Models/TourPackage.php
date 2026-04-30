<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class TourPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'slug',
        'destination',
        'location',
        'short_description',
        'full_description',
        'country',
        'state',
        'city',
        'days',
        'nights',
        'taxes_included',
        'emi_available',
        'coupon_eligible',
        'duration',
        'price',
        'discount_price',
        'offer_price',
        'itinerary',
        'inclusions',
        'exclusions',
        'gallery_images',
        'featured_image',
        'video_url',
        'faq_schema',
        'breadcrumb_schema',
        'sitemap_include',
        'canonical_url',
        'robots',
        'og_title',
        'og_description',
        'schema_type',
        'primary_category',
        'secondary_categories',
        'seasonal_categories',
        'marketing_labels',
        'seo_landing_pages',
        'homepage_display_category',
        'filter_priority',
        'package_type',
        'status',
        'featured',
        'max_people',
        'created_by',
        'seo_meta_title',
        'seo_meta_description',
        'highlight_tags',
        'is_popular',
        'is_featured',
        'featured_position',
        'featured_badge',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'offer_price' => 'decimal:2',
            'days' => 'integer',
            'nights' => 'integer',
            'itinerary' => 'array',
            'inclusions' => 'array',
            'exclusions' => 'array',
            'gallery_images' => 'array',
            'highlight_tags' => 'array',
            'secondary_categories' => 'array',
            'seasonal_categories' => 'array',
            'marketing_labels' => 'array',
            'seo_landing_pages' => 'array',
            'is_popular' => 'boolean',
            'taxes_included' => 'boolean',
            'emi_available' => 'boolean',
            'coupon_eligible' => 'boolean',
            'faq_schema' => 'boolean',
            'breadcrumb_schema' => 'boolean',
            'sitemap_include' => 'boolean',
            'is_featured' => 'boolean',
            'featured_position' => 'integer',
            'filter_priority' => 'integer',
            'featured' => 'boolean',
            'max_people' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PackageImage::class);
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class)->orderBy('sort_order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->latest();
    }

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'seoable');
    }
}
