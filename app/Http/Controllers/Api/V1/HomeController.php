<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Destination;
use App\Models\Testimonial;
use App\Models\TourPackage;
use App\Services\SeoResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    public function __invoke(SeoResolver $seoResolver): JsonResponse
    {
        $homepageSeoFallback = Cache::remember('web.home.seo_fallback', now()->addMinutes(10), function (): array {
            return [
                'title' => 'UNO Trips Premium Travel Experiences',
                'description' => 'Luxury, curated tour packages by UNO Trips with seamless booking and concierge support.',
            ];
        });

        $heroPackages = Cache::remember('web.home.hero_packages', now()->addMinutes(5), function () {
            return TourPackage::query()
                ->where('status', 'published')
                ->latest()
                ->limit(6)
                ->get(['id', 'title', 'slug', 'destination', 'price', 'offer_price', 'featured_image', 'duration', 'created_at']);
        });

        $popularDestinations = Cache::remember('web.home.popular_destinations', now()->addMinutes(10), function () {
            return Destination::query()
                ->where('is_featured', true)
                ->latest()
                ->limit(8)
                ->get(['id', 'name', 'slug', 'hero_image', 'updated_at']);
        });

        $testimonials = Cache::remember('web.home.testimonials', now()->addMinutes(10), function () {
            return Testimonial::query()
                ->where('is_approved', true)
                ->latest()
                ->limit(6)
                ->get(['id', 'customer_name', 'rating', 'photo', 'content', 'created_at']);
        });

        $latestBlogs = Cache::remember('web.home.latest_blogs', now()->addMinutes(5), function () {
            return BlogPost::query()
                ->where('status', 'published')
                ->latest('published_at')
                ->limit(4)
                ->get(['id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at']);
        });

        return response()->json([
            'seo' => $seoResolver->forPage('home', [
                'title' => $homepageSeoFallback['title'],
                'description' => $homepageSeoFallback['description'],
                'canonical_url' => route('home'),
            ]),
            'hero_packages' => $heroPackages,
            'popular_destinations' => $popularDestinations,
            'testimonials' => $testimonials,
            'latest_blogs' => $latestBlogs,
        ]);
    }
}
