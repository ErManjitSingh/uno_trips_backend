<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Support\ImageUploadRules;
use App\Support\ImageVariantManager;
use App\Models\Destination;
use App\Models\ListingPage;
use App\Models\ListingPageCategory;
use App\Models\TourPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ListingPageController extends Controller
{
    public function __construct(private readonly ImageVariantManager $imageVariantManager) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $search = $filters['search'] ?? null;

        $pages = ListingPage::query()
            ->with('category:id,name')
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->orderBy('sort_order')
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/ListingPages/Index', [
            'listingPages' => $pages,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/ListingPages/Create', [
            'listingPage' => null,
            'destinations' => Destination::query()->orderBy('name')->get(['id', 'name']),
            'categories' => ListingPageCategory::query()->orderBy('sort_order')->get(['id', 'name']),
            'packages' => TourPackage::query()
                ->where('status', 'published')
                ->orderBy('title')
                ->get(['id', 'title', 'slug', 'featured_image', 'price', 'offer_price']),
            'blogs' => BlogPost::query()->where('status', 'published')->orderByDesc('published_at')->get(['id', 'title', 'slug']),
            'listingPageOptions' => ListingPage::query()->orderBy('title')->get(['id', 'title', 'slug']),
        ]);
    }

    public function edit(ListingPage $listingPage): Response
    {
        return Inertia::render('Admin/ListingPages/Create', [
            'listingPage' => $listingPage,
            'destinations' => Destination::query()->orderBy('name')->get(['id', 'name']),
            'categories' => ListingPageCategory::query()->orderBy('sort_order')->get(['id', 'name']),
            'packages' => TourPackage::query()
                ->where('status', 'published')
                ->orderBy('title')
                ->get(['id', 'title', 'slug', 'featured_image', 'price', 'offer_price']),
            'blogs' => BlogPost::query()->where('status', 'published')->orderByDesc('published_at')->get(['id', 'title', 'slug']),
            'listingPageOptions' => ListingPage::query()
                ->whereKeyNot($listingPage->id)
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        if ($request->hasFile('banner_image_file')) {
            $validated['banner_image'] = $this->imageVariantManager->optimizeStoredPath(
                $request->file('banner_image_file')->store('listing-banners', 'public'),
                'public'
            );
        }
        ListingPage::query()->create($validated);

        return redirect()->route('admin.listing-pages.index')->with('success', 'Listing page created.');
    }

    public function update(Request $request, ListingPage $listingPage): RedirectResponse
    {
        $validated = $this->validatePayload($request, $listingPage->id);
        if ($request->hasFile('banner_image_file')) {
            if ($listingPage->banner_image && ! str_starts_with($listingPage->banner_image, 'http')) {
                Storage::disk('public')->delete($listingPage->banner_image);
            }
            $validated['banner_image'] = $this->imageVariantManager->optimizeStoredPath(
                $request->file('banner_image_file')->store('listing-banners', 'public'),
                'public'
            );
        }
        $listingPage->update($validated);

        return redirect()->route('admin.listing-pages.index')->with('success', 'Listing page updated.');
    }

    public function destroy(ListingPage $listingPage): RedirectResponse
    {
        if ($listingPage->banner_image && ! str_starts_with($listingPage->banner_image, 'http')) {
            Storage::disk('public')->delete($listingPage->banner_image);
        }

        $listingPage->delete();

        return back()->with('success', 'Listing page deleted.');
    }

    public function duplicate(ListingPage $listingPage): RedirectResponse
    {
        $newTitle = $listingPage->title.' (Copy)';
        $baseSlug = Str::slug($newTitle);
        $slug = $baseSlug;
        $counter = 1;

        while (ListingPage::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        ListingPage::query()->create([
            ...$listingPage->only([
                'page_type',
                'status',
                'banner_image',
                'banner_overlay_text',
                'listing_page_category_id',
                'filters_json',
                'packages_json',
                'content',
                'read_more',
                'tags',
                'seo_meta',
                'blogs_json',
                'internal_links_json',
                'filter_controls_json',
                'meta_title',
                'meta_description',
                'meta_keywords',
                'canonical_url',
                'schema_json',
                'publish_at',
                'sort_order',
            ]),
            'title' => $newTitle,
            'slug' => $slug,
        ]);

        return back()->with('success', 'Listing page duplicated.');
    }

    public function toggleStatus(ListingPage $listingPage): RedirectResponse
    {
        $listingPage->update([
            'status' => $listingPage->status === 'active' ? 'inactive' : 'active',
        ]);

        return back()->with('success', 'Listing page status updated.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:listing_pages,id'],
        ]);

        foreach (array_values($validated['ids']) as $index => $id) {
            ListingPage::query()->whereKey($id)->update(['sort_order' => $index + 1]);
        }

        return back()->with('success', 'Listing pages reordered.');
    }

    public function bulkStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:listing_pages,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        ListingPage::query()
            ->whereIn('id', $validated['ids'])
            ->update(['status' => $validated['status']]);

        return back()->with('success', 'Listing page statuses updated.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:listing_pages,id'],
        ]);

        $pages = ListingPage::query()
            ->whereIn('id', $validated['ids'])
            ->get(['id', 'banner_image']);

        foreach ($pages as $page) {
            if ($page->banner_image && ! str_starts_with($page->banner_image, 'http')) {
                Storage::disk('public')->delete($page->banner_image);
            }
        }

        ListingPage::query()->whereIn('id', $validated['ids'])->delete();

        return back()->with('success', 'Selected listing pages deleted.');
    }

    public function seedDemo(): RedirectResponse
    {
        $samples = [
            ['title' => 'Manali Tour Packages', 'slug' => 'manali-tour-packages', 'page_type' => 'destination'],
            ['title' => 'Summer Holiday Deals', 'slug' => 'summer-holiday-deals', 'page_type' => 'seasonal'],
            ['title' => 'Honeymoon Escapes', 'slug' => 'honeymoon-escapes', 'page_type' => 'theme'],
            ['title' => 'Family Weekend Tours', 'slug' => 'family-weekend-tours', 'page_type' => 'custom'],
            ['title' => 'Women Special Group Tours', 'slug' => 'women-special-group-tours', 'page_type' => 'theme'],
        ];

        $destinationIds = Destination::query()->pluck('id')->values();
        $packageIds = TourPackage::query()->where('status', 'published')->pluck('id')->take(3)->values();
        $blogIds = BlogPost::query()->where('status', 'published')->pluck('id')->take(3)->values();

        $created = 0;

        foreach ($samples as $index => $sample) {
            $page = ListingPage::query()->firstOrNew(['slug' => $sample['slug']]);
            if ($page->exists) {
                continue;
            }

            $page->fill([
                'title' => $sample['title'],
                'slug' => $sample['slug'],
                'page_type' => $sample['page_type'],
                'status' => 'active',
                'filters_json' => [
                    'destination_id' => $destinationIds[$index % max(1, $destinationIds->count())] ?? null,
                    'tour_type' => ['group', 'family', 'honeymoon', 'women_special'][$index % 4],
                    'duration' => ['3D/2N', '4D/3N', '5D/4N', '6D/5N'][$index % 4],
                    'price_range' => ['min' => 8000 + ($index * 2000), 'max' => 30000 + ($index * 5000)],
                    'rating' => 4,
                ],
                'packages_json' => [
                    'mode' => 'manual',
                    'items' => $packageIds->map(fn ($id) => ['id' => (int) $id, 'featured' => false])->all(),
                ],
                'content' => '<p>Premium curated listing page demo content for admin preview.</p>',
                'read_more' => '<p>Expandable detailed itinerary and package content goes here.</p>',
                'tags' => ['demo', 'travel', 'premium'],
                'seo_meta' => [
                    'og_title' => $sample['title'],
                    'og_description' => 'Discover curated tours with premium stays and guided experiences.',
                    'twitter_title' => $sample['title'],
                    'robots_index' => 'index',
                    'robots_follow' => 'follow',
                    'highlights' => ['Best price guaranteed', 'Top rated support', 'Flexible bookings'],
                    'faqs' => [
                        ['q' => 'Is this customizable?', 'a' => 'Yes, itineraries can be customized.'],
                    ],
                ],
                'blogs_json' => ['ids' => $blogIds->all()],
                'internal_links_json' => [
                    ['type' => 'package', 'id' => $packageIds->first(), 'anchor_text' => 'Explore featured package'],
                ],
                'filter_controls_json' => [
                    'enabled' => true,
                    'visible_filters' => ['price', 'duration', 'destination', 'rating', 'tour_type'],
                ],
                'meta_title' => $sample['title'].' | UNO Trips',
                'meta_description' => 'Handpicked travel packages for '.$sample['title'].' with premium experiences.',
                'meta_keywords' => 'travel, packages, tours, demo',
                'canonical_url' => url('/packages/'.$sample['slug']),
                'schema_json' => '{"@context":"https://schema.org","@type":"CollectionPage"}',
                'sort_order' => $index + 1,
            ]);
            $page->save();
            $created++;
        }

        return back()->with('success', "Demo listing pages ready: {$created} new created.");
    }

    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'banner_image' => ['nullable', 'string', 'max:300'],
            'banner_image_file' => ['nullable', 'image', ImageUploadRules::maxFileRule()],
            'banner_overlay_text' => ['nullable', 'string', 'max:190'],
            'slug' => ['nullable', 'string', 'max:210', Rule::unique('listing_pages', 'slug')->ignore($ignoreId)],
            'page_type' => ['required', Rule::in(['destination', 'seasonal', 'theme', 'custom'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'draft', 'scheduled'])],
            'publish_at' => ['nullable', 'date'],
            'listing_page_category_id' => ['nullable', 'integer', 'exists:listing_page_categories,id'],
            'filters_json' => ['nullable', 'array'],
            'filters_json.destination_id' => ['nullable', 'integer', 'exists:destinations,id'],
            'filters_json.hotel_id' => ['nullable', 'integer'],
            'filters_json.duration' => ['nullable', 'string', 'max:80'],
            'filters_json.tour_type' => ['nullable', Rule::in(['group', 'family', 'honeymoon', 'women_special'])],
            'filters_json.season' => ['nullable', Rule::in(['summer', 'winter'])],
            'filters_json.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'filters_json.price_range' => ['nullable', 'array'],
            'filters_json.price_range.min' => ['nullable', 'numeric', 'min:0'],
            'filters_json.price_range.max' => ['nullable', 'numeric', 'min:0'],
            'packages_json' => ['nullable', 'array'],
            'packages_json.mode' => ['nullable', Rule::in(['auto', 'manual'])],
            'packages_json.items' => ['nullable', 'array'],
            'packages_json.items.*.id' => ['required_with:packages_json.items', 'integer', 'exists:tour_packages,id'],
            'packages_json.items.*.featured' => ['nullable', 'boolean'],
            'content' => ['nullable', 'string'],
            'read_more' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:80'],
            'seo_meta' => ['nullable', 'array'],
            'blogs_json' => ['nullable', 'array'],
            'blogs_json.ids' => ['nullable', 'array'],
            'blogs_json.ids.*' => ['integer', 'exists:blog_posts,id'],
            'internal_links_json' => ['nullable', 'array'],
            'internal_links_json.*.type' => ['nullable', Rule::in(['listing_page', 'package', 'blog'])],
            'internal_links_json.*.id' => ['nullable', 'integer'],
            'internal_links_json.*.anchor_text' => ['nullable', 'string', 'max:180'],
            'filter_controls_json' => ['nullable', 'array'],
            'filter_controls_json.enabled' => ['nullable', 'boolean'],
            'filter_controls_json.visible_filters' => ['nullable', 'array'],
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'meta_keywords' => ['nullable', 'string', 'max:600'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'schema_json' => ['nullable', 'string'],
        ]);

        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['title']);
        if (($validated['status'] ?? null) !== 'scheduled') {
            $validated['publish_at'] = null;
        }
        if (blank($validated['schema_json'] ?? null)) {
            $validated['schema_json'] = $this->buildAutoSchemaJson($validated);
        }

        return $validated;
    }

    private function buildAutoSchemaJson(array $payload): string
    {
        $slug = $payload['slug'] ?? Str::slug((string) ($payload['title'] ?? 'listing-page'));
        $faqItems = collect(data_get($payload, 'seo_meta.faqs', []))
            ->filter(fn ($item) => filled($item['q'] ?? null) && filled($item['a'] ?? null))
            ->map(fn ($item) => [
                '@type' => 'Question',
                'name' => (string) $item['q'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => (string) $item['a'],
                ],
            ])
            ->values()
            ->all();

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => (string) ($payload['meta_title'] ?? $payload['title'] ?? 'Tour Packages'),
            'description' => (string) ($payload['meta_description'] ?? $payload['title'] ?? ''),
            'url' => url('/packages/'.$slug),
            'inLanguage' => app()->getLocale(),
        ];

        if (! empty($faqItems)) {
            $schema['mainEntity'] = $faqItems;
        }

        return json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
