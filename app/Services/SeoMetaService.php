<?php

namespace App\Services;

use Illuminate\Support\Str;

class SeoMetaService
{
    public function score(array $data): int
    {
        $score = 0;
        $titleLength = Str::length((string) ($data['meta_title'] ?? ''));
        $descriptionLength = Str::length((string) ($data['meta_description'] ?? ''));

        if ($titleLength >= 30 && $titleLength <= 60) {
            $score += 20;
        }
        if ($descriptionLength >= 70 && $descriptionLength <= 160) {
            $score += 20;
        }
        if (! empty($data['meta_keywords'])) {
            $score += 10;
        }
        if (! empty($data['canonical_url'])) {
            $score += 10;
        }
        if (! empty($data['og_title']) && ! empty($data['og_description'])) {
            $score += 15;
        }
        if (! empty($data['twitter_title']) && ! empty($data['twitter_description'])) {
            $score += 10;
        }
        if (! empty($data['json_ld'])) {
            $score += 10;
        }
        if (($data['robots_index'] ?? true) && ($data['robots_follow'] ?? true)) {
            $score += 5;
        }

        return min(100, $score);
    }

    public function warnings(array $data): array
    {
        $warnings = [];
        $titleLength = Str::length((string) ($data['meta_title'] ?? ''));
        $descriptionLength = Str::length((string) ($data['meta_description'] ?? ''));

        if ($titleLength === 0) {
            $warnings[] = 'Meta title is missing.';
        } elseif ($titleLength > 60) {
            $warnings[] = 'Meta title is longer than 60 characters.';
        }

        if ($descriptionLength === 0) {
            $warnings[] = 'Meta description is missing.';
        } elseif ($descriptionLength > 160) {
            $warnings[] = 'Meta description is longer than 160 characters.';
        }

        if (empty($data['og_image'])) {
            $warnings[] = 'Open Graph image is missing.';
        }
        if (empty($data['canonical_url'])) {
            $warnings[] = 'Canonical URL is missing.';
        }
        if (! ($data['include_in_sitemap'] ?? true)) {
            $warnings[] = 'Page is excluded from sitemap.';
        }

        return $warnings;
    }

    public function schemaTemplate(string $type, array $context = []): string
    {
        $title = $context['title'] ?? 'Sample title';
        $description = $context['description'] ?? 'Sample description';
        $url = $context['url'] ?? url('/');
        $image = $context['image'] ?? '';

        $template = match ($type) {
            'Product' => [
                '@context' => 'https://schema.org',
                '@type' => 'Product',
                'name' => $title,
                'description' => $description,
                'image' => $image,
                'url' => $url,
            ],
            'Tour Package' => [
                '@context' => 'https://schema.org',
                '@type' => 'TouristTrip',
                'name' => $title,
                'description' => $description,
                'url' => $url,
            ],
            'Local Business' => [
                '@context' => 'https://schema.org',
                '@type' => 'LocalBusiness',
                'name' => $title,
                'description' => $description,
                'url' => $url,
                'image' => $image,
            ],
            default => [
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => $title,
                'description' => $description,
                'mainEntityOfPage' => $url,
                'image' => $image,
            ],
        };

        return json_encode($template, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}';
    }

    public function autoGenerate(array $input, array $source): array
    {
        $title = trim((string) ($source['title'] ?? ''));
        $description = trim((string) ($source['description'] ?? ''));
        $slug = trim((string) ($source['slug'] ?? ''));

        $metaTitleTemplate = trim((string) ($input['meta_title_template'] ?? '{title} | UNO Trips'));
        $metaDescriptionTemplate = trim((string) ($input['meta_description_template'] ?? '{description}'));

        return [
            'meta_title' => $this->applyTemplate($metaTitleTemplate, $title, $description, $slug),
            'meta_description' => $this->applyTemplate($metaDescriptionTemplate, $title, $description, $slug),
            'slug' => Str::slug($slug !== '' ? $slug : $title),
        ];
    }

    private function applyTemplate(string $template, string $title, string $description, string $slug): string
    {
        return strtr($template, [
            '{title}' => $title,
            '{description}' => $description,
            '{slug}' => $slug,
        ]);
    }
}

