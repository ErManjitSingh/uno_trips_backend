<?php

namespace App\Services;

use App\Models\ListingPage;
use App\Models\TourPackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ManualPaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class ListingPageQueryService
{
    public function resolvePackages(ListingPage $listingPage, int $perPage = 12): LengthAwarePaginator
    {
        $cacheKey = sprintf('listing-page:%d:packages:%d', $listingPage->id, $perPage);

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($listingPage, $perPage) {
            if (($listingPage->packages_json['mode'] ?? 'auto') === 'manual') {
                return $this->resolveManualPackages($listingPage, $perPage);
            }

            $filters = (array) ($listingPage->filters_json ?? []);

            return $this->buildQuery($filters)
                ->latest()
                ->paginate($perPage)
                ->through(function (TourPackage $package): array {
                    return [
                        'id' => $package->id,
                        'title' => $package->title,
                        'slug' => $package->slug,
                        'destination' => $package->destination,
                        'duration' => $package->duration,
                        'price' => $package->price,
                        'offer_price' => $package->offer_price,
                        'featured_image' => $package->featured_image,
                        'package_type' => $package->package_type,
                    ];
                });
        });
    }

    public function clearCache(ListingPage $listingPage): void
    {
        Cache::forget(sprintf('listing-page:%d:packages:%d', $listingPage->id, 12));
        Cache::forget(sprintf('listing-page:%d:packages:%d', $listingPage->id, 9));
    }

    private function resolveManualPackages(ListingPage $listingPage, int $perPage): LengthAwarePaginator
    {
        $items = collect($listingPage->packages_json['items'] ?? []);
        $ids = $items->pluck('id')->map(fn ($id) => (int) $id)->filter()->values();
        $featuredMap = $items->mapWithKeys(fn ($item) => [(int) ($item['id'] ?? 0) => (bool) ($item['featured'] ?? false)]);

        $packages = TourPackage::query()
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn ($package) => $ids->search($package->id))
            ->values()
            ->map(function (TourPackage $package) use ($featuredMap): array {
                return [
                    'id' => $package->id,
                    'title' => $package->title,
                    'slug' => $package->slug,
                    'destination' => $package->destination,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'offer_price' => $package->offer_price,
                    'featured_image' => $package->featured_image,
                    'package_type' => $package->package_type,
                    'featured_on_listing' => (bool) ($featuredMap[$package->id] ?? false),
                ];
            });

        $currentPage = ManualPaginator::resolveCurrentPage() ?: 1;

        return new ManualPaginator(
            $packages->forPage($currentPage, $perPage)->values(),
            $packages->count(),
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }

    private function buildQuery(array $filters): Builder
    {
        $query = TourPackage::query()->where('status', 'published');

        if (! empty($filters['destination_id'])) {
            $query->where('destination', $this->resolveDestinationName((int) $filters['destination_id']));
        }

        if (! empty($filters['hotel_id'])) {
            // A dedicated hotels relation is not available yet; use package id as fallback.
            $query->where('id', (int) $filters['hotel_id']);
        }

        if (! empty($filters['season'])) {
            $query->whereJsonContains('seasonal_categories', (string) $filters['season']);
        }

        if (! empty($filters['tour_type'])) {
            $this->applyTourTypeFilter($query, (string) $filters['tour_type']);
        }

        if (! empty($filters['duration'])) {
            $query->where('duration', (string) $filters['duration']);
        }

        if (! empty($filters['rating'])) {
            $query->whereHas('reviews', function (Builder $reviewQuery) use ($filters): void {
                $reviewQuery->where('status', 'approved')
                    ->where('rating', '>=', (int) $filters['rating']);
            });
        }

        $min = data_get($filters, 'price_range.min');
        $max = data_get($filters, 'price_range.max');
        if ($min !== null && $max !== null) {
            $query->whereBetween('price', [(float) $min, (float) $max]);
        }

        return $query;
    }

    private function resolveDestinationName(int $destinationId): ?string
    {
        return Cache::remember("listing-page:destination:{$destinationId}", now()->addHours(6), function () use ($destinationId) {
            return \App\Models\Destination::query()->whereKey($destinationId)->value('name');
        });
    }

    private function applyTourTypeFilter(Builder $query, string $tourType): void
    {
        $normalized = strtolower($tourType);

        if (in_array($normalized, ['family', 'honeymoon'], true)) {
            $query->where('package_type', $normalized);
            return;
        }

        if ($normalized === 'group') {
            $query->whereIn('package_type', ['domestic', 'international', 'adventure']);
            return;
        }

        if ($normalized === 'women_special') {
            $query->whereJsonContains('marketing_labels', 'women_special');
        }
    }
}
