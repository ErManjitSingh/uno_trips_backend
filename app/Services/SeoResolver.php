<?php

namespace App\Services;

use App\Models\SeoMeta;
use App\Models\WebsiteSetting;
use Illuminate\Support\Facades\Cache;

class SeoResolver
{
    public function forPage(string $pageKey, array $fallback = []): array
    {
        $meta = Cache::remember("seo.meta.page.{$pageKey}", now()->addMinutes(10), function () use ($pageKey) {
            return SeoMeta::query()
                ->where('entity_type', 'page')
                ->where('entity_id', 0)
                ->where('page_key', $pageKey)
                ->first();
        });

        return $this->buildPayload($meta?->toArray() ?? [], $fallback);
    }

    public function forModel(string $entityType, int $entityId, array $fallback = []): array
    {
        $meta = Cache::remember("seo.meta.model.{$entityType}.{$entityId}", now()->addMinutes(10), function () use ($entityType, $entityId) {
            return SeoMeta::query()
                ->where('entity_type', $entityType)
                ->where('entity_id', $entityId)
                ->where('page_key', '')
                ->first();
        });

        return $this->buildPayload($meta?->toArray() ?? [], $fallback);
    }

    private function buildPayload(array $meta, array $fallback): array
    {
        $settings = Cache::remember('seo.website_settings', now()->addMinutes(10), function () {
            return WebsiteSetting::query()->first();
        });

        $title = $meta['meta_title'] ?? ($fallback['title'] ?? ($settings?->seo_meta_title ?? 'UNO Trips'));
        $description = $meta['meta_description'] ?? ($fallback['description'] ?? ($settings?->seo_meta_description ?? ''));
        $canonical = $meta['canonical_url'] ?? ($fallback['canonical_url'] ?? null);
        $ogTitle = $meta['og_title'] ?? ($fallback['og_title'] ?? $title);
        $ogDescription = $meta['og_description'] ?? ($fallback['og_description'] ?? $description);
        $ogImage = $meta['og_image'] ?? ($settings?->seo_og_image ? asset('storage/'.$settings->seo_og_image) : null);
        $twitterTitle = $meta['twitter_title'] ?? ($fallback['twitter_title'] ?? $ogTitle);
        $twitterDescription = $meta['twitter_description'] ?? ($fallback['twitter_description'] ?? $ogDescription);
        $twitterImage = $meta['twitter_image'] ?? $ogImage;
        $robots = $this->resolveRobots($meta, $fallback);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $meta['meta_keywords'] ?? ($settings?->seo_keywords ?? ''),
            'canonical_url' => $canonical,
            'robots' => $robots,
            'og' => [
                'title' => $ogTitle,
                'description' => $ogDescription,
                'image' => $ogImage ? $this->toAbsoluteUrl($ogImage) : null,
                'url' => $meta['og_url'] ?? $canonical,
            ],
            'twitter' => [
                'title' => $twitterTitle,
                'description' => $twitterDescription,
                'image' => $twitterImage ? $this->toAbsoluteUrl($twitterImage) : null,
            ],
            'json_ld' => $meta['json_ld'] ?? null,
        ];
    }

    private function toAbsoluteUrl(string $value): string
    {
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return asset($value);
    }

    private function resolveRobots(array $meta, array $fallback): array
    {
        if (array_key_exists('robots_index', $meta) || array_key_exists('robots_follow', $meta)) {
            return [
                'index' => (bool) ($meta['robots_index'] ?? true),
                'follow' => (bool) ($meta['robots_follow'] ?? true),
            ];
        }

        $fallbackRobots = strtolower(trim((string) ($fallback['robots'] ?? '')));
        if ($fallbackRobots !== '') {
            return [
                'index' => ! str_contains($fallbackRobots, 'noindex'),
                'follow' => ! str_contains($fallbackRobots, 'nofollow'),
            ];
        }

        return ['index' => true, 'follow' => true];
    }
}

