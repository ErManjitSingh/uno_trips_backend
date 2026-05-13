<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Enums\ApprovalStatus;
use App\Models\ActivityLog;
use App\Models\Faq;
use App\Models\PackageCategory;
use App\Models\TourPackage;
use App\Services\ContentApprovalService;
use App\Support\ImageVariantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
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
        Gate::authorize('viewAny', TourPackage::class);

        $filters = $request->validate([
            'tab' => ['nullable', 'string', 'max:30'],
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'package_type' => ['nullable', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'destination' => ['nullable', 'string', 'max:190'],
            'edit' => ['nullable', 'integer'],
            'duplicate' => ['nullable', 'integer'],
        ]);

        $allowedTabs = ['all', 'add', 'pricing'];
        if (isset($filters['tab']) && ! in_array($filters['tab'], $allowedTabs, true)) {
            unset($filters['tab']);
        }

        $search = $filters['search'] ?? null;

        $packages = TourPackage::query()
            ->when($request->user()->isExecutive(), fn ($q) => $q->where('created_by', $request->user()->id))
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('destination', 'like', "%{$search}%")
                        ->orWhere('location_name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['package_type'] ?? null, fn ($query, $type) => $query->where('package_type', $type))
            ->when($filters['destination'] ?? null, fn ($query, $destination) => $query->where('location_name', $destination))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $selectedPackageId = $filters['edit'] ?? $filters['duplicate'] ?? null;
        $selectedPackage = $selectedPackageId
            ? TourPackage::query()
                ->with(['faqs' => fn ($query) => $query->orderBy('sort_order')])
                ->find($selectedPackageId)
            : null;

        if ($selectedPackage) {
            Gate::authorize('view', $selectedPackage);
        }

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
            'destinations' => TourPackage::query()
                ->whereNotNull('location_name')
                ->orderBy('location_name')
                ->pluck('location_name')
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->values(),
            'destinationOptions' => collect(),
            'packageCategories' => PackageCategory::query()
                ->where('status', 'Active')
                ->orderBy('type')
                ->orderBy('name')
                ->get(['id', 'name', 'type', 'icon', 'color']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', TourPackage::class);

        $rules = [
            'title' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:170', 'unique:tour_packages,slug'],
            'destination' => ['nullable', 'string', 'max:190'],
            'location_name' => ['required', 'string', 'max:190'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
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
            'offer_price_calendar_json' => ['nullable', 'string', 'max:100000'],
            'package_type' => ['required', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'is_popular' => ['boolean'],
            'itinerary_text' => ['nullable', 'string'],
            'inclusions_text' => ['nullable', 'string'],
            'exclusions_text' => ['nullable', 'string'],
            'included_features_json' => ['nullable', 'string', 'max:100000'],
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
            'itinerary_json' => ['nullable', 'string', 'max:100000'],
            'faqs_json' => ['nullable', 'string', 'max:100000'],
        ];
        $validated = $request->validate($rules);

        $faqPayload = $this->parsedFaqsPayload($validated);
        $validated['destination'] = $validated['location_name'];
        $validated['city'] = $validated['location_name'];
        $validated['offer_price_calendar'] = $this->parseOfferPriceCalendar($validated);
        $validated['offer_price'] = collect($validated['offer_price_calendar'])->min('offer_price') ?: null;
        $validated['itinerary'] = $this->parsedItineraryPayload($validated);
        $validated['inclusions'] = $this->toLinesArray($validated['inclusions_text'] ?? null);
        $validated['exclusions'] = $this->toLinesArray($validated['exclusions_text'] ?? null);
        $validated['included_features'] = $this->parseIncludedFeatures($validated);
        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $this->imageVariantManager->storeWithVariants($request->file('featured_image'), 'tour-packages', 'public');
        }
        unset(
            $validated['itinerary_text'],
            $validated['inclusions_text'],
            $validated['exclusions_text'],
            $validated['itinerary_json'],
            $validated['offer_price_calendar_json'],
            $validated['included_features_json'],
            $validated['faqs_json'],
            $validated['faqs'],
        );

        $package = TourPackage::create($validated);
        $this->syncFaqs($package, $faqPayload);

        if (Schema::hasColumn('tour_packages', 'approval_status')) {
            if ($request->user()->isExecutive()) {
                $package->forceFill([
                    'created_by' => $request->user()->id,
                    'approval_status' => ApprovalStatus::Pending->value,
                    'status' => 'draft',
                    'approved_by' => null,
                    'approved_at' => null,
                    'approval_remarks' => null,
                ])->save();
                app(ContentApprovalService::class)->notifyAdminsOfNewPackage($package);
            } else {
                $package->forceFill([
                    'created_by' => $package->created_by ?? $request->user()->id,
                    'approval_status' => ApprovalStatus::Approved->value,
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                ])->save();
            }
        }

        $this->logPackageActivity($request, 'package.created', $package, [
            'title' => $package->title,
            'status' => $package->status,
        ]);

        return back()->with('success', 'Package created successfully.');
    }

    public function update(Request $request, TourPackage $package): RedirectResponse
    {
        Gate::authorize('update', $package);

        if ($request->user()->isExecutive()) {
            $request->merge(['status' => 'draft']);
        }

        $incomingStatus = $request->input('status');
        $normalizedStatus = is_string($incomingStatus) && in_array(trim($incomingStatus), ['draft', 'published'], true)
            ? trim($incomingStatus)
            : $package->status;

        $request->merge([
            'title' => trim((string) ($request->input('title') ?? '')) ?: $package->title,
            'slug' => trim((string) ($request->input('slug') ?? '')) ?: $package->slug,
            'destination' => trim((string) ($request->input('destination') ?? '')) ?: ($package->location_name ?? $package->destination),
            'location_name' => trim((string) ($request->input('location_name') ?? '')) ?: ($package->location_name ?? $package->destination),
            'duration' => trim((string) ($request->input('duration') ?? '')) ?: $package->duration,
            'price' => $request->input('price', $package->price),
            'package_type' => $request->input('package_type', $package->package_type),
            'status' => $normalizedStatus,
        ]);

        $rules = [
            'title' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:170', Rule::unique('tour_packages', 'slug')->ignore($package->id)],
            'destination' => ['nullable', 'string', 'max:190'],
            'location_name' => ['required', 'string', 'max:190'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
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
            'offer_price_calendar_json' => ['nullable', 'string', 'max:100000'],
            'package_type' => ['required', Rule::in(['domestic', 'international', 'honeymoon', 'family', 'adventure'])],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'is_popular' => ['boolean'],
            'itinerary_text' => ['nullable', 'string'],
            'inclusions_text' => ['nullable', 'string'],
            'exclusions_text' => ['nullable', 'string'],
            'included_features_json' => ['nullable', 'string', 'max:100000'],
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
            'itinerary_json' => ['nullable', 'string', 'max:100000'],
            'faqs_json' => ['nullable', 'string', 'max:100000'],
        ];
        $validated = $request->validate($rules);

        $faqPayload = $this->parsedFaqsPayload($validated);
        $validated['destination'] = $validated['location_name'];
        $validated['city'] = $validated['location_name'];
        $validated['offer_price_calendar'] = $this->parseOfferPriceCalendar($validated);
        $validated['offer_price'] = collect($validated['offer_price_calendar'])->min('offer_price') ?: null;
        $validated['itinerary'] = $this->parsedItineraryPayload($validated);
        $validated['inclusions'] = $this->toLinesArray($validated['inclusions_text'] ?? null);
        $validated['exclusions'] = $this->toLinesArray($validated['exclusions_text'] ?? null);
        $validated['included_features'] = $this->parseIncludedFeatures($validated);
        if ($request->hasFile('featured_image')) {
            $this->imageVariantManager->deleteWithVariants($package->featured_image, 'public');
            $validated['featured_image'] = $this->imageVariantManager->storeWithVariants($request->file('featured_image'), 'tour-packages', 'public');
        } else {
            unset($validated['featured_image']);
        }
        unset(
            $validated['itinerary_text'],
            $validated['inclusions_text'],
            $validated['exclusions_text'],
            $validated['itinerary_json'],
            $validated['offer_price_calendar_json'],
            $validated['included_features_json'],
            $validated['faqs_json'],
            $validated['faqs'],
        );

        $previousApproval = Schema::hasColumn('tour_packages', 'approval_status')
            ? $package->approval_status
            : null;

        $package->update($validated);
        $this->syncFaqs($package, $faqPayload);

        if (Schema::hasColumn('tour_packages', 'approval_status') && $request->user()->isExecutive()) {
            $package->forceFill([
                'approval_status' => ApprovalStatus::Pending->value,
                'approved_by' => null,
                'approved_at' => null,
                'approval_remarks' => null,
            ])->save();

            if ($previousApproval === ApprovalStatus::Rejected->value) {
                app(ContentApprovalService::class)->notifyAdminsOfNewPackage($package->fresh());
            }
        }
        $this->logPackageActivity($request, 'package.updated', $package, [
            'title' => $package->title,
            'status' => $package->status,
        ]);

        return back()->with('success', 'Package updated.');
    }

    public function destroy(TourPackage $package): RedirectResponse
    {
        Gate::authorize('delete', $package);

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

    public function uploadItineraryDayImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $this->imageVariantManager->storeWithVariants($validated['image'], 'tour-packages/itinerary', 'public');
        $normalized = str_replace('\\', '/', ltrim($path, '/'));
        // Root-relative URL so images work on 127.0.0.1:8000, localhost, or any APP_URL
        $url = '/storage/'.$normalized;

        return response()->json([
            'path' => $path,
            'url' => $url,
        ]);
    }

    public function uploadEditorImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $this->imageVariantManager->storeWithVariants($validated['image'], 'tour-packages/editor', 'public');
        $normalized = str_replace('\\', '/', ltrim($path, '/'));
        $url = '/storage/'.$normalized;

        return response()->json([
            'path' => $path,
            'url' => $url,
        ]);
    }

    public function bulkDiscount(Request $request): RedirectResponse
    {
        Gate::authorize('bulkDiscount', TourPackage::class);

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
        Gate::authorize('bulkDelete', TourPackage::class);

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

    /**
     * @param  array<string, mixed>  $validated
     * @return list<array{title: string, description: string, meals: string, hotel: string, transport: string, travel_mode: string}>
     */
    private function parsedItineraryPayload(array $validated): array
    {
        $raw = $validated['itinerary_json'] ?? null;
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $this->normalizeItineraryDays($decoded);
            }
        }

        return $this->toLinesArray($validated['itinerary_text'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<array{q?: string, a?: string}>
     */
    private function parsedFaqsPayload(array $validated): array
    {
        $raw = $validated['faqs_json'] ?? null;
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : [];
        }

        return $validated['faqs'] ?? [];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<array{start_date: string, end_date: string, offer_price: float}>
     */
    private function parseOfferPriceCalendar(array $validated): array
    {
        $raw = $validated['offer_price_calendar_json'] ?? null;
        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        return collect($decoded)
            ->filter(fn ($item) => is_array($item))
            ->map(function (array $item): ?array {
                $start = trim((string) ($item['start_date'] ?? ''));
                $end = trim((string) ($item['end_date'] ?? ''));
                $price = $item['offer_price'] ?? null;
                if ($start === '' || $end === '' || $price === null || $price === '') {
                    return null;
                }

                return [
                    'start_date' => $start,
                    'end_date' => $end,
                    'offer_price' => (float) $price,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<array{key: string, label: string, icon: string}>
     */
    private function parseIncludedFeatures(array $validated): array
    {
        $raw = $validated['included_features_json'] ?? null;
        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        return collect($decoded)
            ->filter(fn ($item) => is_array($item))
            ->map(function (array $item): ?array {
                $key = trim((string) ($item['key'] ?? ''));
                $label = trim((string) ($item['label'] ?? ''));
                $icon = trim((string) ($item['icon'] ?? ''));
                if ($label === '') {
                    return null;
                }

                return [
                    'key' => $key !== '' ? $key : Str::slug($label),
                    'label' => $label,
                    'icon' => $icon,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  list<mixed>  $days
     * @return list<array{title: string, description: string, meals: string, hotel: string, transport: string, travel_mode: string, image: string}>
     */
    private function normalizeItineraryDays(array $days): array
    {
        return collect($days)
            ->map(function ($item): ?array {
                if (! is_array($item)) {
                    return null;
                }
                $mode = (($item['travel_mode'] ?? 'day') === 'night') ? 'night' : 'day';
                $imageRaw = trim((string) ($item['image'] ?? ''));
                $image = $imageRaw !== '' ? Str::limit($imageRaw, 2000, '') : '';

                return [
                    'title' => (string) ($item['title'] ?? ''),
                    'description' => (string) ($item['description'] ?? ''),
                    'meals' => (string) ($item['meals'] ?? ''),
                    'hotel' => (string) ($item['hotel'] ?? ''),
                    'transport' => (string) ($item['transport'] ?? ''),
                    'travel_mode' => $mode,
                    'image' => $image,
                ];
            })
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
