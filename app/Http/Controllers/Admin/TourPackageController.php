<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Faq;
use App\Models\PackageCategory;
use App\Models\TourPackage;
use App\Support\ImageVariantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TourPackageController extends Controller
{
    public function __construct(private readonly ImageVariantManager $imageVariantManager)
    {
    }

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'string', 'max:30'],
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'package_type' => ['nullable', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'destination' => ['nullable', 'string', 'max:120'],
            'edit' => ['nullable', 'integer'],
            'duplicate' => ['nullable', 'integer'],
        ]);

        $allowedTabs = ['all', 'add', 'pricing'];
        if (isset($filters['tab']) && ! in_array($filters['tab'], $allowedTabs, true)) {
            unset($filters['tab']);
        }

        $search = $filters['search'] ?? null;

        $packages = TourPackage::query()
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('destination', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['package_type'] ?? null, fn ($query, $type) => $query->where('package_type', $type))
            ->when($filters['destination'] ?? null, fn ($query, $destination) => $query->where('destination', $destination))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $selectedPackageId = $filters['edit'] ?? $filters['duplicate'] ?? null;
        $selectedPackage = $selectedPackageId
            ? TourPackage::query()
                ->with(['faqs' => fn ($query) => $query->orderBy('sort_order')])
                ->find($selectedPackageId)
            : null;

        return Inertia::render('Admin/Packages/Index', [
            'packages' => $packages,
            'selectedPackage' => $selectedPackage,
            'filters' => [
                'tab' => $filters['tab'] ?? 'all',
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
                'package_type' => $filters['package_type'] ?? '',
                'destination' => $filters['destination'] ?? '',
                'edit' => $filters['edit'] ?? null,
                'duplicate' => $filters['duplicate'] ?? null,
            ],
            'destinations' => TourPackage::query()->select('destination')->distinct()->orderBy('destination')->pluck('destination'),
            'packageCategories' => PackageCategory::query()
                ->where('status', 'Active')
                ->orderBy('type')
                ->orderBy('name')
                ->get(['id', 'name', 'type', 'icon', 'color']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:170', 'unique:tour_packages,slug'],
            'destination' => ['required', 'string', 'max:120'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'full_description' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'days' => ['nullable', 'integer', 'min:0'],
            'nights' => ['nullable', 'integer', 'min:0'],
            'taxes_included' => ['boolean'],
            'emi_available' => ['boolean'],
            'coupon_eligible' => ['boolean'],
            'duration' => ['required', 'string', 'max:80'],
            'price' => ['required', 'numeric', 'min:0'],
            'offer_price' => ['nullable', 'numeric', 'min:0'],
            'package_type' => ['required', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'is_popular' => ['boolean'],
            'itinerary_text' => ['nullable', 'string'],
            'inclusions_text' => ['nullable', 'string'],
            'exclusions_text' => ['nullable', 'string'],
            'seo_meta_title' => ['nullable', 'string', 'max:190'],
            'seo_meta_description' => ['nullable', 'string', 'max:300'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'video_url' => ['nullable', 'string', 'max:300'],
            'faq_schema' => ['boolean'],
            'breadcrumb_schema' => ['boolean'],
            'sitemap_include' => ['boolean'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'robots' => ['nullable', 'string', 'max:60'],
            'og_title' => ['nullable', 'string', 'max:190'],
            'og_description' => ['nullable', 'string', 'max:3000'],
            'schema_type' => ['nullable', 'string', 'max:80'],
            'featured_badge' => ['nullable', 'string', 'max:40'],
            'primary_category' => ['nullable', 'string', 'max:120'],
            'secondary_categories' => ['nullable', 'array'],
            'secondary_categories.*' => ['string', 'max:120'],
            'highlight_tags' => ['nullable', 'array'],
            'highlight_tags.*' => ['string', 'max:120'],
            'seasonal_categories' => ['nullable', 'array'],
            'seasonal_categories.*' => ['string', 'max:120'],
            'marketing_labels' => ['nullable', 'array'],
            'marketing_labels.*' => ['string', 'max:120'],
            'seo_landing_pages' => ['nullable', 'array'],
            'seo_landing_pages.*' => ['string', 'max:300'],
            'homepage_display_category' => ['nullable', 'string', 'max:120'],
            'filter_priority' => ['nullable', 'integer', 'min:1'],
            'faqs' => ['nullable', 'array'],
            'faqs.*.q' => ['nullable', 'string', 'max:255'],
            'faqs.*.a' => ['nullable', 'string'],
        ]);

        $validated['itinerary'] = $this->toLinesArray($validated['itinerary_text'] ?? null);
        $validated['inclusions'] = $this->toLinesArray($validated['inclusions_text'] ?? null);
        $validated['exclusions'] = $this->toLinesArray($validated['exclusions_text'] ?? null);
        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $this->imageVariantManager->storeWithVariants($request->file('featured_image'), 'tour-packages', 'public');
        }
        unset($validated['itinerary_text'], $validated['inclusions_text'], $validated['exclusions_text']);

        $package = TourPackage::create($validated);
        $this->syncFaqs($package, $validated['faqs'] ?? []);
        $this->logPackageActivity($request, 'package.created', $package, [
            'title' => $package->title,
            'status' => $package->status,
        ]);

        return back()->with('success', 'Package created successfully.');
    }

    public function update(Request $request, TourPackage $package): RedirectResponse
    {
        $request->merge([
            'title' => trim((string) ($request->input('title') ?? '')) ?: $package->title,
            'slug' => trim((string) ($request->input('slug') ?? '')) ?: $package->slug,
            'destination' => trim((string) ($request->input('destination') ?? '')) ?: $package->destination,
            'duration' => trim((string) ($request->input('duration') ?? '')) ?: $package->duration,
            'price' => $request->input('price', $package->price),
            'package_type' => $request->input('package_type', $package->package_type),
            'status' => $request->input('status', $package->status),
        ]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:170', Rule::unique('tour_packages', 'slug')->ignore($package->id)],
            'destination' => ['required', 'string', 'max:120'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'full_description' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'days' => ['nullable', 'integer', 'min:0'],
            'nights' => ['nullable', 'integer', 'min:0'],
            'taxes_included' => ['boolean'],
            'emi_available' => ['boolean'],
            'coupon_eligible' => ['boolean'],
            'duration' => ['required', 'string', 'max:80'],
            'price' => ['required', 'numeric', 'min:0'],
            'offer_price' => ['nullable', 'numeric', 'min:0'],
            'package_type' => ['required', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'is_popular' => ['boolean'],
            'itinerary_text' => ['nullable', 'string'],
            'inclusions_text' => ['nullable', 'string'],
            'exclusions_text' => ['nullable', 'string'],
            'seo_meta_title' => ['nullable', 'string', 'max:190'],
            'seo_meta_description' => ['nullable', 'string', 'max:300'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'video_url' => ['nullable', 'string', 'max:300'],
            'faq_schema' => ['boolean'],
            'breadcrumb_schema' => ['boolean'],
            'sitemap_include' => ['boolean'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'robots' => ['nullable', 'string', 'max:60'],
            'og_title' => ['nullable', 'string', 'max:190'],
            'og_description' => ['nullable', 'string', 'max:3000'],
            'schema_type' => ['nullable', 'string', 'max:80'],
            'featured_badge' => ['nullable', 'string', 'max:40'],
            'primary_category' => ['nullable', 'string', 'max:120'],
            'secondary_categories' => ['nullable', 'array'],
            'secondary_categories.*' => ['string', 'max:120'],
            'highlight_tags' => ['nullable', 'array'],
            'highlight_tags.*' => ['string', 'max:120'],
            'seasonal_categories' => ['nullable', 'array'],
            'seasonal_categories.*' => ['string', 'max:120'],
            'marketing_labels' => ['nullable', 'array'],
            'marketing_labels.*' => ['string', 'max:120'],
            'seo_landing_pages' => ['nullable', 'array'],
            'seo_landing_pages.*' => ['string', 'max:300'],
            'homepage_display_category' => ['nullable', 'string', 'max:120'],
            'filter_priority' => ['nullable', 'integer', 'min:1'],
            'faqs' => ['nullable', 'array'],
            'faqs.*.q' => ['nullable', 'string', 'max:255'],
            'faqs.*.a' => ['nullable', 'string'],
        ]);

        $validated['itinerary'] = $this->toLinesArray($validated['itinerary_text'] ?? null);
        $validated['inclusions'] = $this->toLinesArray($validated['inclusions_text'] ?? null);
        $validated['exclusions'] = $this->toLinesArray($validated['exclusions_text'] ?? null);
        if ($request->hasFile('featured_image')) {
            $this->imageVariantManager->deleteWithVariants($package->featured_image, 'public');
            $validated['featured_image'] = $this->imageVariantManager->storeWithVariants($request->file('featured_image'), 'tour-packages', 'public');
        } else {
            unset($validated['featured_image']);
        }
        unset($validated['itinerary_text'], $validated['inclusions_text'], $validated['exclusions_text']);

        $package->update($validated);
        $this->syncFaqs($package, $validated['faqs'] ?? []);
        $this->logPackageActivity($request, 'package.updated', $package, [
            'title' => $package->title,
            'status' => $package->status,
        ]);

        return back()->with('success', 'Package updated.');
    }

    public function destroy(TourPackage $package): RedirectResponse
    {
        ActivityLog::query()->create([
            'actor_id' => request()->user()?->id,
            'action' => 'package.deleted',
            'module' => 'packages',
            'target_type' => TourPackage::class,
            'target_id' => $package->id,
            'meta' => ['title' => $package->title],
        ]);
        $package->delete();

        return back()->with('success', 'Package deleted.');
    }

    public function duplicateLog(Request $request, TourPackage $package): RedirectResponse
    {
        $this->logPackageActivity($request, 'package.duplicate_initiated', $package, [
            'title' => $package->title,
        ]);

        return back();
    }

    public function bulkDiscount(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'discount_type' => ['required', Rule::in(['percent', 'fixed', 'clear'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'scope' => ['nullable', Rule::in(['all', 'published', 'draft'])],
        ]);

        $type = $validated['discount_type'];
        $value = (float) ($validated['discount_value'] ?? 0);
        $scope = $validated['scope'] ?? 'all';

        $query = TourPackage::query();
        if ($scope !== 'all') {
            $query->where('status', $scope);
        }

        $updatedCount = 0;

        $query->select(['id', 'price', 'offer_price'])->chunkById(200, function ($packages) use ($type, $value, &$updatedCount): void {
            foreach ($packages as $package) {
                $price = (float) $package->price;
                if ($price <= 0) {
                    continue;
                }

                if ($type === 'clear') {
                    $package->offer_price = null;
                    $package->save();
                    $updatedCount++;
                    continue;
                }

                $nextOffer = $type === 'percent'
                    ? max(0, round($price - (($price * $value) / 100), 2))
                    : max(0, round($price - $value, 2));

                $package->offer_price = $nextOffer >= $price ? null : $nextOffer;
                $package->save();
                $updatedCount++;
            }
        });

        return back()->with('success', "Bulk discount applied on {$updatedCount} package(s).");
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:tour_packages,id'],
        ]);

        $ids = collect($validated['ids'])->map(fn ($id) => (int) $id)->unique()->values();
        $packages = TourPackage::query()
            ->whereIn('id', $ids)
            ->select(['id', 'featured_image'])
            ->get();

        foreach ($packages as $package) {
            $this->imageVariantManager->deleteWithVariants($package->featured_image, 'public');
        }

        Faq::query()->whereIn('tour_package_id', $ids)->delete();
        TourPackage::query()->whereIn('id', $ids)->delete();

        return back()->with('success', "Deleted {$ids->count()} package(s).");
    }

    private function logPackageActivity(Request $request, string $action, TourPackage $package, array $meta = []): void
    {
        ActivityLog::query()->create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'module' => 'packages',
            'target_type' => TourPackage::class,
            'target_id' => $package->id,
            'meta' => $meta,
        ]);
    }

    private function toLinesArray(?string $value): array
    {
        return collect(explode("\n", (string) $value))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values()
            ->all();
    }

    private function syncFaqs(TourPackage $package, array $faqs): void
    {
        $normalized = collect($faqs)
            ->map(function ($item) {
                return [
                    'question' => trim((string) ($item['q'] ?? '')),
                    'answer' => trim((string) ($item['a'] ?? '')),
                ];
            })
            ->filter(fn ($item) => $item['question'] !== '' || $item['answer'] !== '')
            ->values();

        Faq::query()->where('tour_package_id', $package->id)->delete();

        $normalized->each(function ($item, $index) use ($package): void {
            Faq::query()->create([
                'tour_package_id' => $package->id,
                'question' => $item['question'],
                'answer' => $item['answer'],
                'sort_order' => $index + 1,
            ]);
        });
    }
}
