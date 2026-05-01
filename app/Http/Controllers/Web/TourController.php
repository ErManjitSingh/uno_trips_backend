<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\TourPackage;
use App\Services\SeoResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TourController extends Controller
{
    public function index(Request $request, SeoResolver $seoResolver): Response
    {
        $filters = $request->validate([
            'destination' => ['nullable', 'string', 'max:120'],
            'duration' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', 'string', 'in:latest,price_asc,price_desc,popular'],
        ]);

        $sort = $filters['sort'] ?? 'latest';

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

        return Inertia::render('Web/Tours/Index', [
            'seo' => $seoResolver->forPage('tours', [
                'title' => 'Tour Packages',
                'description' => 'Explore curated tour packages across top destinations.',
                'canonical_url' => route('tours.index'),
            ]),
            'filters' => $filters,
            'packages' => $query->paginate(9)->withQueryString(),
            'destinations' => Cache::remember('web.tours.destinations', now()->addMinutes(10), function () {
                return Destination::query()->orderBy('name')->get(['id', 'name', 'slug']);
            }),
        ]);
    }

    public function show(TourPackage $tourPackage, SeoResolver $seoResolver): Response
    {
        $canonicalUrl = $tourPackage->canonical_url ?: route('tours.show', $tourPackage);

        return Inertia::render('Web/Tours/Show', [
            'seo' => $seoResolver->forModel('tour_package', $tourPackage->id, [
                'title' => $tourPackage->seo_meta_title ?: $tourPackage->title,
                'description' => $tourPackage->seo_meta_description ?: ($tourPackage->short_description ?: $tourPackage->title),
                'canonical_url' => $canonicalUrl,
                'og_title' => $tourPackage->og_title ?: ($tourPackage->seo_meta_title ?: $tourPackage->title),
                'og_description' => $tourPackage->og_description ?: ($tourPackage->seo_meta_description ?: ($tourPackage->short_description ?: $tourPackage->title)),
                'robots' => $tourPackage->robots ?: 'index,follow',
            ]),
            'tour' => $tourPackage->load([
                'faqs',
                'reviews' => fn ($query) => $query
                    ->where('status', 'approved')
                    ->where('is_approved', true)
                    ->latest(),
            ]),
            'related' => TourPackage::query()
                ->where('status', 'published')
                ->where('id', '!=', $tourPackage->id)
                ->where('destination', $tourPackage->destination)
                ->limit(4)
                ->get(),
        ]);
    }

    public function destination(Destination $destination): Response
    {
        return Inertia::render('Web/Destinations/Show', [
            'destination' => $destination,
            'packages' => TourPackage::query()
                ->where('status', 'published')
                ->where('destination', $destination->name)
                ->latest()
                ->paginate(9)
                ->withQueryString(),
        ]);
    }
}
