<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'location_name',
        'latitude',
        'longitude',
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
        'offer_price_calendar',
        'itinerary',
        'inclusions',
        'exclusions',
        'included_features',
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
            'offer_price_calendar' => 'array',
            'days' => 'integer',
            'nights' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'itinerary' => 'array',
            'inclusions' => 'array',
            'exclusions' => 'array',
            'included_features' => 'array',
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

    /**
     * Match packages for a tours listing filter (destination name/slug or free text).
     * When the value matches a destinations row, package destination or location_name is
     * compared to that row's name, state, district, and city (e.g. "Himachal" vs "Himachal Pradesh").
     */
    public function scopeWhereDestinationFilter(Builder $query, ?string $filterValue): Builder
    {
        if ($filterValue === null || trim($filterValue) === '') {
            return $query;
        }

        $filterValue = trim($filterValue);

        $resolved = Destination::query()
            ->where(function (Builder $q) use ($filterValue): void {
                $q->where('name', $filterValue)->orWhere('slug', $filterValue);
            })
            ->first();

        $terms = $resolved
            ? collect([
                $resolved->name,
                $resolved->state,
                $resolved->district,
                $resolved->city,
            ])
            : collect([$filterValue]);

        $terms = $terms
            ->filter(fn ($t) => is_string($t) && trim($t) !== '')
            ->map(fn ($t) => trim((string) $t))
            ->unique()
            ->values();

        if ($terms->isEmpty()) {
            return $query;
        }

        return $query->where(function (Builder $outer) use ($terms): void {
            foreach ($terms as $index => $term) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $outer->{$method}(function (Builder $inner) use ($term): void {
                    $inner->where('destination', $term)->orWhere('location_name', $term);
                });
            }
        });
    }
}
