<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ListingPage;
use App\Services\ListingPageQueryService;
use App\Services\SeoResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ListingPageController extends Controller
{
    public function show(Request $request, ListingPage $listingPage, ListingPageQueryService $queryService, SeoResolver $seoResolver): Response
    {
        $isPreview = $request->boolean('preview') && $request->user();
        abort_if($listingPage->status !== 'active' && ! $isPreview, 404);

        return Inertia::render('Web/Tours/Index', [
            'seo' => $seoResolver->forPage('listing-page-'.$listingPage->id, [
                'title' => $listingPage->meta_title ?: $listingPage->title,
                'description' => $listingPage->meta_description ?: $listingPage->title,
                'canonical_url' => $listingPage->canonical_url ?: route('packages.show', $listingPage->slug),
            ]),
            'listingPage' => [
                'title' => $listingPage->title,
                'slug' => $listingPage->slug,
                'page_type' => $listingPage->page_type,
                'filters_json' => $listingPage->filters_json,
            ],
            'packages' => $queryService->resolvePackages($listingPage, 9),
            'filters' => [],
            'destinations' => [],
        ]);
    }
}
