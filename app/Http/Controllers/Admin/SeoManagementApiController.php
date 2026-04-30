<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\SeoMeta;
use App\Models\SeoTechnicalSetting;
use App\Models\TourPackage;
use App\Services\SeoMetaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SeoManagementApiController extends Controller
{
    public function index(SeoMetaService $seoMetaService): JsonResponse
    {
        $entries = SeoMeta::query()->latest()->get()->map(function (SeoMeta $entry) use ($seoMetaService): array {
            $payload = $entry->toArray();

            return [
                ...$payload,
                'score' => $seoMetaService->score($payload),
                'warnings' => $seoMetaService->warnings($payload),
            ];
        });

        return response()->json(['data' => $entries]);
    }

    public function store(Request $request, SeoMetaService $seoMetaService): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $validated = $this->preparePayload($validated, $request);
        $this->assertEntityExists($validated['entity_type'], (int) ($validated['entity_id'] ?? 0));

        $entry = SeoMeta::query()->updateOrCreate(
            [
                'entity_type' => $validated['entity_type'],
                'entity_id' => (int) ($validated['entity_id'] ?? 0),
                'page_key' => $validated['page_key'] ?? '',
            ],
            $validated
        );

        $payload = $entry->toArray();
        $this->clearSeoCaches();

        return response()->json([
            'message' => 'SEO entry saved.',
            'data' => [
                ...$payload,
                'score' => $seoMetaService->score($payload),
                'warnings' => $seoMetaService->warnings($payload),
            ],
        ]);
    }

    public function show(SeoMeta $seoMeta, SeoMetaService $seoMetaService): JsonResponse
    {
        $payload = $seoMeta->toArray();

        return response()->json([
            'data' => [
                ...$payload,
                'score' => $seoMetaService->score($payload),
                'warnings' => $seoMetaService->warnings($payload),
            ],
        ]);
    }

    public function update(Request $request, SeoMeta $seoMeta, SeoMetaService $seoMetaService): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $validated = $this->preparePayload($validated, $request);

        $seoMeta->update($validated);
        $payload = $seoMeta->toArray();
        $this->clearSeoCaches();

        return response()->json([
            'message' => 'SEO entry updated.',
            'data' => [
                ...$payload,
                'score' => $seoMetaService->score($payload),
                'warnings' => $seoMetaService->warnings($payload),
            ],
        ]);
    }

    public function destroy(SeoMeta $seoMeta): JsonResponse
    {
        $seoMeta->delete();
        $this->clearSeoCaches();

        return response()->json(['message' => 'SEO entry deleted.']);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:seo_meta,id'],
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:160'],
        ]);

        SeoMeta::query()->whereIn('id', $validated['ids'])->update([
            'meta_title' => $this->cleanText($validated['meta_title'] ?? null, 190),
            'meta_description' => $this->cleanText($validated['meta_description'] ?? null, 160),
        ]);
        $this->clearSeoCaches();

        return response()->json(['message' => 'Bulk SEO update completed.']);
    }

    public function autoGenerate(Request $request, SeoMetaService $seoMetaService): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => ['required', Rule::in(['page', 'blog_post', 'tour_package'])],
            'entity_id' => ['nullable', 'integer', 'min:0'],
            'page_key' => ['nullable', 'string', 'max:80'],
            'meta_title_template' => ['nullable', 'string', 'max:190'],
            'meta_description_template' => ['nullable', 'string', 'max:220'],
        ]);

        $source = $this->sourceFromEntity($validated['entity_type'], (int) ($validated['entity_id'] ?? 0), (string) ($validated['page_key'] ?? ''));
        $generated = $seoMetaService->autoGenerate($validated, $source);

        $entry = SeoMeta::query()->updateOrCreate(
            [
                'entity_type' => $validated['entity_type'],
                'entity_id' => (int) ($validated['entity_id'] ?? 0),
                'page_key' => $validated['page_key'] ?? '',
            ],
            $generated
        );
        $this->clearSeoCaches();

        return response()->json([
            'message' => 'SEO generated from template.',
            'data' => $entry,
        ]);
    }

    public function updateTechnical(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lazy_load_enabled' => ['required', 'boolean'],
            'minify_assets_enabled' => ['required', 'boolean'],
            'sitemap_auto_generate' => ['required', 'boolean'],
            'robots_txt' => ['nullable', 'string'],
        ]);

        $setting = SeoTechnicalSetting::query()->firstOrCreate([], [
            'lazy_load_enabled' => true,
            'minify_assets_enabled' => false,
            'sitemap_auto_generate' => true,
        ]);

        $setting->update($validated);
        $this->clearSeoCaches();

        if (isset($validated['robots_txt'])) {
            File::put(public_path('robots.txt'), (string) $validated['robots_txt']);
        }

        return response()->json([
            'message' => 'Technical SEO settings updated.',
            'data' => $setting->fresh(),
        ]);
    }

    public function schemaTemplate(Request $request, SeoMetaService $seoMetaService): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['Article', 'Product', 'Tour Package', 'Local Business'])],
            'title' => ['nullable', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'url' => ['nullable', 'url', 'max:300'],
            'image' => ['nullable', 'string', 'max:300'],
        ]);

        return response()->json([
            'template' => $seoMetaService->schemaTemplate($validated['type'], $validated),
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'entity_type' => ['required', Rule::in(['page', 'blog_post', 'tour_package'])],
            'entity_id' => ['nullable', 'integer', 'min:0'],
            'page_key' => ['nullable', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:190'],
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:300'],
            'og_title' => ['nullable', 'string', 'max:190'],
            'og_description' => ['nullable', 'string'],
            'og_image' => ['nullable', 'string', 'max:300'],
            'og_url' => ['nullable', 'url', 'max:300'],
            'twitter_title' => ['nullable', 'string', 'max:190'],
            'twitter_description' => ['nullable', 'string'],
            'twitter_image' => ['nullable', 'string', 'max:300'],
            'robots_index' => ['required', 'boolean'],
            'robots_follow' => ['required', 'boolean'],
            'include_in_sitemap' => ['required', 'boolean'],
            'schema_type' => ['nullable', Rule::in(['Article', 'Product', 'Tour Package', 'Local Business'])],
            'json_ld' => ['nullable', 'string'],
            'image_alt' => ['nullable', 'string', 'max:255'],
            'image_title' => ['nullable', 'string', 'max:255'],
            'image_file_name' => ['nullable', 'string', 'max:255'],
            'og_image_file' => ['nullable', 'image', 'max:5120'],
            'twitter_image_file' => ['nullable', 'image', 'max:5120'],
        ]);
    }

    private function preparePayload(array $validated, Request $request): array
    {
        $validated['page_key'] = (string) ($validated['page_key'] ?? '');
        $validated['slug'] = empty($validated['slug']) ? null : Str::slug((string) $validated['slug']);
        $validated['meta_title'] = $this->cleanText($validated['meta_title'] ?? null, 190);
        $validated['meta_description'] = $this->cleanText($validated['meta_description'] ?? null, 160);
        $validated['meta_keywords'] = $this->cleanText($validated['meta_keywords'] ?? null, 500);
        $validated['canonical_url'] = $validated['canonical_url'] ?? null;
        $validated['og_title'] = $this->cleanText($validated['og_title'] ?? null, 190);
        $validated['og_description'] = $this->cleanText($validated['og_description'] ?? null, 300);
        $validated['og_image'] = $this->cleanText($validated['og_image'] ?? null, 300);
        $validated['twitter_title'] = $this->cleanText($validated['twitter_title'] ?? null, 190);
        $validated['twitter_description'] = $this->cleanText($validated['twitter_description'] ?? null, 300);
        $validated['twitter_image'] = $this->cleanText($validated['twitter_image'] ?? null, 300);
        $validated['json_ld'] = $this->validJsonOrNull($validated['json_ld'] ?? null);
        $validated['image_alt'] = $this->cleanText($validated['image_alt'] ?? null, 255);
        $validated['image_title'] = $this->cleanText($validated['image_title'] ?? null, 255);
        $validated['image_file_name'] = $this->cleanText($validated['image_file_name'] ?? null, 255);

        if ($request->hasFile('og_image_file')) {
            $validated['og_image'] = $request->file('og_image_file')->store('seo', 'public');
        }
        if ($request->hasFile('twitter_image_file')) {
            $validated['twitter_image'] = $request->file('twitter_image_file')->store('seo', 'public');
        }

        unset($validated['og_image_file'], $validated['twitter_image_file']);

        return $validated;
    }

    private function cleanText(?string $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }

        $clean = trim(strip_tags($value));
        if ($clean === '') {
            return null;
        }

        return Str::limit($clean, $max, '');
    }

    private function validJsonOrNull(?string $json): ?string
    {
        if ($json === null || trim($json) === '') {
            return null;
        }

        json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return $json;
    }

    private function sourceFromEntity(string $entityType, int $entityId, string $pageKey): array
    {
        return match ($entityType) {
            'blog_post' => $this->blogSource($entityId),
            'tour_package' => $this->packageSource($entityId),
            default => [
                'title' => Str::headline($pageKey !== '' ? $pageKey : 'Page'),
                'description' => 'Page level SEO content.',
                'slug' => $pageKey,
            ],
        };
    }

    private function blogSource(int $entityId): array
    {
        $blog = BlogPost::query()->find($entityId);
        if (! $blog) {
            return ['title' => '', 'description' => '', 'slug' => ''];
        }

        return [
            'title' => $blog->title,
            'description' => $blog->excerpt ?? '',
            'slug' => $blog->slug ?? '',
        ];
    }

    private function packageSource(int $entityId): array
    {
        $package = TourPackage::query()->find($entityId);
        if (! $package) {
            return ['title' => '', 'description' => '', 'slug' => ''];
        }

        return [
            'title' => $package->title,
            'description' => $package->short_description ?? '',
            'slug' => $package->slug ?? '',
        ];
    }

    private function assertEntityExists(string $entityType, int $entityId): void
    {
        if ($entityType === 'page') {
            return;
        }

        if ($entityType === 'blog_post' && ! BlogPost::query()->whereKey($entityId)->exists()) {
            abort(422, 'Blog post not found for SEO mapping.');
        }

        if ($entityType === 'tour_package' && ! TourPackage::query()->whereKey($entityId)->exists()) {
            abort(422, 'Tour package not found for SEO mapping.');
        }
    }

    private function clearSeoCaches(): void
    {
        Cache::forget('admin.seo.meta_entries');
        Cache::forget('admin.seo.blog_entities');
        Cache::forget('admin.seo.package_entities');
        Cache::forget('seo.website_settings');
        Cache::forget('web.home.seo_fallback');
        Cache::forget('seo.sitemap.xml');
    }
}

