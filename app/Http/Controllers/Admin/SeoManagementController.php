<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\SeoMeta;
use App\Models\SeoTechnicalSetting;
use App\Models\TourPackage;
use App\Services\SeoMetaService;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SeoManagementController extends Controller
{
    public function index(SeoMetaService $seoMetaService): Response
    {
        $pages = collect([
            ['id' => 'home', 'label' => 'Home Page', 'description' => 'Main landing page'],
            ['id' => 'about', 'label' => 'About Page', 'description' => 'Company story and trust content'],
            ['id' => 'contact', 'label' => 'Contact Page', 'description' => 'Lead capture page'],
        ]);

        $blogs = Cache::remember('admin.seo.blog_entities', now()->addMinutes(5), function () {
            return BlogPost::query()
                ->latest()
                ->limit(100)
                ->get(['id', 'title', 'slug', 'excerpt', 'featured_image'])
                ->map(fn (BlogPost $blog): array => [
                    'id' => $blog->id,
                    'label' => $blog->title,
                    'slug' => $blog->slug,
                    'description' => $blog->excerpt,
                    'image' => $blog->featured_image,
                ]);
        });

        $packages = Cache::remember('admin.seo.package_entities', now()->addMinutes(5), function () {
            return TourPackage::query()
                ->latest()
                ->limit(100)
                ->get(['id', 'title', 'slug', 'short_description', 'featured_image'])
                ->map(fn (TourPackage $package): array => [
                    'id' => $package->id,
                    'label' => $package->title,
                    'slug' => $package->slug,
                    'description' => $package->short_description,
                    'image' => $package->featured_image,
                ]);
        });

        $metaEntries = Cache::remember('admin.seo.meta_entries', now()->addMinutes(3), function () use ($seoMetaService) {
            return SeoMeta::query()->get()->map(function (SeoMeta $entry) use ($seoMetaService): array {
                $payload = $entry->toArray();

                return [
                    ...$payload,
                    'score' => $seoMetaService->score($payload),
                    'warnings' => $seoMetaService->warnings($payload),
                ];
            });
        });

        $technical = SeoTechnicalSetting::query()->first() ?? SeoTechnicalSetting::query()->create([
            'lazy_load_enabled' => true,
            'minify_assets_enabled' => false,
            'sitemap_auto_generate' => true,
            'robots_txt' => "User-agent: *\nAllow: /\nSitemap: ".url('/sitemap.xml'),
        ]);

        return Inertia::render('Admin/SeoManagement/Index', [
            'entities' => [
                'pages' => $pages,
                'blogs' => $blogs,
                'packages' => $packages,
            ],
            'seoEntries' => $metaEntries,
            'technical' => $technical,
            'schemaTemplates' => ['Article', 'Product', 'Tour Package', 'Local Business'],
        ]);
    }
}

