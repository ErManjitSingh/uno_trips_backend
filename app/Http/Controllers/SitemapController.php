<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Destination;
use App\Models\TourPackage;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('seo.sitemap.xml', now()->addMinutes(15), function () {
            $urls = collect([
                ['loc' => URL::to('/'), 'lastmod' => now()->toDateString()],
                ['loc' => route('about'), 'lastmod' => now()->toDateString()],
                ['loc' => route('tours.index'), 'lastmod' => now()->toDateString()],
                ['loc' => route('blog.index'), 'lastmod' => now()->toDateString()],
                ['loc' => route('contact.index'), 'lastmod' => now()->toDateString()],
            ])
                ->merge(
                    TourPackage::query()
                        ->publiclyVisible()
                        ->get(['slug', 'updated_at'])
                        ->map(fn ($tour) => ['loc' => route('tours.show', $tour->slug), 'lastmod' => $tour->updated_at?->toDateString()])
                )
                ->merge(
                    Destination::query()
                        ->get(['slug', 'updated_at'])
                        ->map(fn ($destination) => ['loc' => route('destinations.show', $destination->slug), 'lastmod' => $destination->updated_at?->toDateString()])
                )
                ->merge(
                    BlogPost::query()
                        ->publiclyVisible()
                        ->get(['slug', 'updated_at'])
                        ->map(fn ($post) => ['loc' => route('blog.show', $post->slug), 'lastmod' => $post->updated_at?->toDateString()])
                );

            return view('seo.sitemap', ['urls' => $urls])->render();
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    public function robots(): Response
    {
        $content = "User-agent: *\nAllow: /\nSitemap: ".route('sitemap')."\n";

        return response($content, 200)->header('Content-Type', 'text/plain');
    }
}
