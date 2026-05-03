<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\TourPackage;
use App\Services\SeoResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TourController extends Controller
{
    public function index(Request $request, SeoResolver $seoResolver): JsonResponse
    {
        $filters = $request->validate([
            'destination' => ['nullable', 'string', 'max:120'],
            'duration' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', 'string', 'in:latest,price_asc,price_desc,popular'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $sort = $filters['sort'] ?? 'latest';
        $perPage = $filters['per_page'] ?? 9;

        $query = TourPackage::query()
            ->where('status', 'published')
            ->when($filters['destination'] ?? null, fn ($q, $destination) => $q->where('destination', $destination))
            ->when($filters['duration'] ?? null, fn ($q, $duration) => $q->where('duration', $duration))
            ->when($filters['category'] ?? null, fn ($q, $category) => $q->where('package_type', $category));

        if ($sort === 'price_asc') {
            $query->orderBy('offer_price')->orderBy('price');
        } elseif ($sort === 'price_desc') {
            $query->orderByDesc('offer_price')->orderByDesc('price');
        } elseif ($sort === 'popular') {
            $query->orderByDesc('is_popular')->latest();
        } else {
            $query->latest();
        }

        $destinations = Cache::remember('web.tours.destinations', now()->addMinutes(10), function () {
            return Destination::query()->orderBy('name')->get(['id', 'name', 'slug']);
        });

        return response()->json([
            'seo' => $seoResolver->forPage('tours', [
                'title' => 'Tour Packages',
                'description' => 'Explore curated tour packages across top destinations.',
                'canonical_url' => route('tours.index'),
            ]),
            'filters' => [
                'destination' => $filters['destination'] ?? null,
                'duration' => $filters['duration'] ?? null,
                'category' => $filters['category'] ?? null,
                'sort' => $sort,
            ],
            'destinations' => $destinations,
            'packages' => $query->paginate($perPage)->withQueryString(),
        ]);
    }

    public function show(string $slug, SeoResolver $seoResolver): JsonResponse
    {
        $tourPackage = TourPackage::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $canonicalUrl = $tourPackage->canonical_url ?: route('tours.show', $tourPackage);

        $tourPackage->load([
            'faqs',
            'reviews' => fn ($query) => $query
                ->where('status', 'approved')
                ->where('is_approved', true)
                ->latest(),
        ]);

        $related = TourPackage::query()
            ->where('status', 'published')
            ->where('id', '!=', $tourPackage->id)
            ->where('destination', $tourPackage->destination)
            ->limit(4)
            ->get();

        return response()->json([
            'seo' => $seoResolver->forModel('tour_package', $tourPackage->id, [
                'title' => $tourPackage->seo_meta_title ?: $tourPackage->title,
                'description' => $tourPackage->seo_meta_description ?: ($tourPackage->short_description ?: $tourPackage->title),
                'canonical_url' => $canonicalUrl,
                'og_title' => $tourPackage->og_title ?: ($tourPackage->seo_meta_title ?: $tourPackage->title),
                'og_description' => $tourPackage->og_description ?: ($tourPackage->seo_meta_description ?: ($tourPackage->short_description ?: $tourPackage->title)),
                'robots' => $tourPackage->robots ?: 'index,follow',
            ]),
            'tour' => $tourPackage,
            'related' => $related,
        ]);
    }
}
