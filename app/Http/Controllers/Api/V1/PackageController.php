<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\TourPackage;
use App\Services\SeoResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PackageController extends Controller
{
    /**
     * "All Packages" screen — bundle wrapper + saari published packages (paginated) + har item par images.
     * Detail ke liye: GET /api/v1/package/{slug} (poora full data ek object mein).
     */
    public function allPackagesBundle(Request $request, SeoResolver $seoResolver): JsonResponse
    {
        ['query' => $query, 'filters' => $filters, 'sort' => $sort, 'per_page' => $perPage] = $this->packageListQuery($request, 36);

        $destinations = Cache::remember('web.tours.destinations', now()->addMinutes(10), function () {
            return Destination::query()->orderBy('name')->get(['id', 'name', 'slug']);
        });

        $paginator = $query->paginate($perPage)->withQueryString();

        $seo = $seoResolver->forPage('tours', [
            'title' => 'All Packages',
            'description' => 'Explore curated tour packages across top destinations.',
            'canonical_url' => route('tours.index'),
        ]);

        return response()->json([
            'bundle' => [
                'key' => 'all_packages',
                'title' => 'All Packages',
                'subtitle' => 'Browse every published tour package.',
                'seo' => $seo,
                'detail_endpoint' => url('/api/v1/package/{slug}'),
            ],
            'facets' => [
                'destinations' => $destinations,
            ],
            'filters_applied' => [
                'destination' => $filters['destination'] ?? null,
                'duration' => $filters['duration'] ?? null,
                'category' => $filters['category'] ?? null,
                'sort' => $sort,
            ],
            'packages' => $paginator,
        ]);
    }

    /**
     * Published tour packages for the public frontend (full model + relations).
     *
     * Query: destination, duration, category, sort, per_page (max 100),
     * include=comma list: images (default on), faqs, none (strip defaults).
     */
    public function index(Request $request, SeoResolver $seoResolver): JsonResponse
    {
        ['query' => $query, 'filters' => $filters, 'sort' => $sort, 'per_page' => $perPage] = $this->packageListQuery($request);

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

    /**
     * Single published package — ek response mein poora data: saare columns + images + faqs + reviews
     * + seo_meta (social ke saath) + resolved seo + related_packages (sab ek JSON object).
     */
    public function show(string $slug, SeoResolver $seoResolver): JsonResponse
    {
        $package = TourPackage::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->with([
                'images' => fn ($q) => $q->orderByDesc('is_featured')->orderBy('id'),
                'faqs',
                'seoMeta.social',
                'reviews' => fn ($query) => $query
                    ->where('status', 'approved')
                    ->where('is_approved', true)
                    ->latest(),
            ])
            ->firstOrFail();

        $canonicalUrl = $package->canonical_url ?: route('tours.show', $package);

        $related = TourPackage::query()
            ->where('status', 'published')
            ->where('id', '!=', $package->id)
            ->where('destination', $package->destination)
            ->with([
                'images' => fn ($q) => $q->orderByDesc('is_featured')->orderBy('id'),
            ])
            ->limit(6)
            ->get();

        $seo = $seoResolver->forModel('tour_package', $package->id, [
            'title' => $package->seo_meta_title ?: $package->title,
            'description' => $package->seo_meta_description ?: ($package->short_description ?: $package->title),
            'canonical_url' => $canonicalUrl,
            'og_title' => $package->og_title ?: ($package->seo_meta_title ?: $package->title),
            'og_description' => $package->og_description ?: ($package->seo_meta_description ?: ($package->short_description ?: $package->title)),
            'robots' => $package->robots ?: 'index,follow',
        ]);

        $payload = $package->toArray();
        $payload['seo'] = $seo;
        $payload['related_packages'] = $related->map(fn (TourPackage $p) => $p->toArray())->values()->all();

        return response()->json($payload);
    }

    /**
     * @return array{query: Builder, filters: array, sort: string, per_page: int}
     */
    private function packageListQuery(Request $request, int $defaultPerPage = 20): array
    {
        $filters = $request->validate([
            'destination' => ['nullable', 'string', 'max:120'],
            'duration' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', 'string', 'in:latest,price_asc,price_desc,popular'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'include' => ['nullable', 'string', 'max:200'],
        ]);

        $sort = $filters['sort'] ?? 'latest';
        $perPage = $filters['per_page'] ?? $defaultPerPage;

        $include = collect(explode(',', (string) ($filters['include'] ?? 'images')))
            ->map(fn (string $s) => trim(strtolower($s)))
            ->filter()
            ->values();

        if ($include->contains('none')) {
            $include = collect();
        }

        $query = TourPackage::query()
            ->where('status', 'published')
            ->when($filters['destination'] ?? null, fn ($q, $destination) => $q->where('destination', $destination))
            ->when($filters['duration'] ?? null, fn ($q, $duration) => $q->where('duration', $duration))
            ->when($filters['category'] ?? null, fn ($q, $category) => $q->where('package_type', $category));

        if ($include->isEmpty() || $include->contains('images')) {
            $query->with([
                'images' => fn ($q) => $q->orderByDesc('is_featured')->orderBy('id'),
            ]);
        }

        if ($include->contains('faqs')) {
            $query->with(['faqs']);
        }

        if ($sort === 'price_asc') {
            $query->orderBy('offer_price')->orderBy('price');
        } elseif ($sort === 'price_desc') {
            $query->orderByDesc('offer_price')->orderByDesc('price');
        } elseif ($sort === 'popular') {
            $query->orderByDesc('is_popular')->latest();
        } else {
            $query->latest();
        }

        return [
            'query' => $query,
            'filters' => $filters,
            'sort' => $sort,
            'per_page' => $perPage,
        ];
    }
}
