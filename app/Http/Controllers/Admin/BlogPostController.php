<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\SeoMeta;
use App\Support\ImageVariantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function __construct(private readonly ImageVariantManager $imageVariantManager)
    {
    }

    public function create(Request $request): Response
    {
        $draftId = $request->integer('draft');
        $post = null;

        if ($draftId) {
            $post = BlogPost::query()
                ->whereKey($draftId)
                ->whereIn('status', ['draft', 'scheduled'])
                ->with(['tags:id,name', 'categories:id,name', 'seoMeta'])
                ->first();
        }

        return $this->renderForm($post);
    }

    public function edit(BlogPost $blog): Response
    {
        $blog->load(['tags:id,name', 'categories:id,name', 'seoMeta']);

        return $this->renderForm($blog);
    }

    public function drafts(): Response
    {
        $drafts = BlogPost::query()
            ->whereIn('status', ['draft', 'scheduled'])
            ->latest('updated_at')
            ->select(['id', 'title', 'slug', 'excerpt', 'content', 'updated_at'])
            ->paginate(18)
            ->withQueryString();

        return Inertia::render('Admin/Blogs/Drafts', [
            'drafts' => $drafts,
        ]);
    }

    public function seoManager(): Response
    {
        $posts = BlogPost::query()
            ->latest()
            ->select([
                'id',
                'title',
                'slug',
                'content',
                'seo_meta_title',
                'seo_meta_description',
            ])
            ->paginate(50)
            ->through(function (BlogPost $post): array {
                $keyword = $this->extractFocusKeyword($post->content);
                $suggestions = $this->generateSeoSuggestions(
                    $post->seo_meta_title,
                    $post->seo_meta_description,
                    $keyword
                );

                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'seo_title' => $post->seo_meta_title,
                    'meta_description' => $post->seo_meta_description,
                    'keyword' => $keyword,
                    'seo_score' => $this->calculateSeoScore(
                        $post->seo_meta_title,
                        $post->seo_meta_description,
                        $keyword
                    ),
                    'suggestions' => $suggestions,
                ];
            });

        return Inertia::render('Admin/Blogs/SeoManager', [
            'posts' => $posts,
        ]);
    }

    public function index(): Response
    {
        $posts = BlogPost::query()->with('category:id,name')->latest()->paginate(12);

        $posts->getCollection()->transform(function (BlogPost $post): BlogPost {
            $post->setAttribute('author_name', 'Admin Team');
            $post->setAttribute('views_count', ((int) $post->id * 137) % 12000 + 120);

            return $post;
        });

        return Inertia::render('Admin/Blogs/Index', [
            'posts' => $posts,
            'categories' => BlogCategory::query()->select('id', 'name')->orderBy('name')->get(),
            'authors' => ['Admin Team'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $payload = $this->preparePayload($validated, $request);
        $payload['created_by'] = Auth::id();

        $post = BlogPost::create($payload);
        $this->syncTaxonomies($post, $validated);
        $this->syncSeoMeta($post, $validated);
        $this->logBlogActivity($request, 'blog.created', $post, ['title' => $post->title, 'status' => $post->status]);

        return redirect()->route('admin.blogs.index')->with('success', 'Blog post created.');
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $validated = $this->validatePayload($request, $blog);
        $payload = $this->preparePayload($validated, $request, $blog);
        $payload['created_by'] = $validated['author_id'] ?? $blog->created_by;

        $blog->update($payload);
        $this->syncTaxonomies($blog, $validated);
        $this->syncSeoMeta($blog, $validated);
        $this->logBlogActivity($request, 'blog.updated', $blog, ['title' => $blog->title, 'status' => $blog->status]);

        return redirect()->route('admin.blogs.index')->with('success', 'Blog post updated.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        ActivityLog::query()->create([
            'actor_id' => request()->user()?->id,
            'action' => 'blog.deleted',
            'module' => 'blogs',
            'target_type' => BlogPost::class,
            'target_id' => $blog->id,
            'meta' => ['title' => $blog->title],
        ]);
        $blog->delete();

        return back()->with('success', 'Blog post deleted.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['delete', 'publish'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:blog_posts,id'],
        ]);

        if ($validated['action'] === 'delete') {
            BlogPost::query()->whereIn('id', $validated['ids'])->delete();

            return back()->with('success', 'Selected posts deleted.');
        }

        BlogPost::query()
            ->whereIn('id', $validated['ids'])
            ->update([
                'status' => 'published',
                'published_at' => Carbon::now(),
            ]);

        return back()->with('success', 'Selected posts published.');
    }

    public function quickPublish(BlogPost $blog): RedirectResponse
    {
        $isPublished = $blog->status === 'published';

        $blog->update([
            'status' => $isPublished ? 'draft' : 'published',
            'published_at' => $isPublished ? null : Carbon::now(),
        ]);

        return back()->with('success', $isPublished ? 'Post moved to draft.' : 'Post published.');
    }

    public function updateSeo(Request $request, BlogPost $blog): RedirectResponse
    {
        $validated = $request->validate([
            'seo_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'keyword' => ['nullable', 'string', 'max:120'],
        ]);

        $content = $blog->content ?? '';
        $content = preg_replace('/(^|\n)Focus Keyword:\s*.*/i', '', $content) ?? $content;
        if (! empty($validated['keyword'])) {
            $content = trim($content)."\n\nFocus Keyword: ".$validated['keyword'];
        }

        $blog->update([
            'seo_meta_title' => $validated['seo_title'] ?? null,
            'seo_meta_description' => $validated['meta_description'] ?? null,
            'content' => trim($content),
        ]);

        return back()->with('success', 'SEO fields updated.');
    }

    public function bulkSeoUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:blog_posts,id'],
            'seo_title_prefix' => ['nullable', 'string', 'max:80'],
            'keyword_suffix' => ['nullable', 'string', 'max:80'],
        ]);

        $posts = BlogPost::query()->whereIn('id', $validated['ids'])->get();
        foreach ($posts as $post) {
            $seoTitle = trim(($validated['seo_title_prefix'] ?? '').' '.$post->title);
            $keyword = trim(($post->slug ?? '').' '.($validated['keyword_suffix'] ?? ''));

            $content = $post->content ?? '';
            $content = preg_replace('/(^|\n)Focus Keyword:\s*.*/i', '', $content) ?? $content;
            if ($keyword !== '') {
                $content = trim($content)."\n\nFocus Keyword: ".$keyword;
            }

            $post->update([
                'seo_meta_title' => $seoTitle !== '' ? $seoTitle : $post->seo_meta_title,
                'content' => trim($content),
            ]);
        }

        return back()->with('success', 'Bulk SEO update completed.');
    }

    public function uploadEditorImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $this->imageVariantManager->storeWithVariants($validated['image'], 'uploads/blog', 'public');
        $normalized = str_replace('\\', '/', ltrim($path, '/'));

        return response()->json([
            'url' => '/storage/'.$normalized,
        ]);
    }

    public function autosave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'draft_id' => ['nullable', 'integer', 'exists:blog_posts,id'],
            'title' => ['nullable', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:190'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'seo_meta_title' => ['nullable', 'string', 'max:190'],
            'seo_meta_description' => ['nullable', 'string', 'max:300'],
        ]);

        if (empty(trim((string) ($validated['title'] ?? ''))) && empty(trim((string) ($validated['content'] ?? '')))) {
            return response()->json(['saved' => false, 'message' => 'Nothing to save yet.']);
        }

        $draft = null;
        if (! empty($validated['draft_id'])) {
            $draft = BlogPost::query()->find($validated['draft_id']);
        }

        $payload = [
            'title' => trim((string) ($validated['title'] ?? 'Untitled Draft')),
            'slug' => $this->resolveUniqueBlogSlug((string) ($validated['slug'] ?? $validated['title'] ?? 'untitled-draft'), $draft?->id),
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $this->sanitizeBlogHtml((string) ($validated['content'] ?? '')),
            'seo_meta_title' => $validated['seo_meta_title'] ?? null,
            'seo_meta_description' => $validated['seo_meta_description'] ?? null,
            'status' => 'draft',
            'created_by' => $draft?->created_by ?? Auth::id(),
        ];

        if ($draft) {
            $draft->update($payload);
        } else {
            $draft = BlogPost::query()->create($payload);
        }

        return response()->json([
            'saved' => true,
            'draft_id' => $draft->id,
            'updated_at' => optional($draft->updated_at)->toIso8601String(),
        ]);
    }

    private function extractFocusKeyword(?string $content): string
    {
        if (! $content) {
            return '';
        }

        if (preg_match('/Focus Keyword:\s*(.+)$/im', $content, $matches) === 1) {
            return trim($matches[1]);
        }

        return '';
    }

    private function calculateSeoScore(?string $title, ?string $meta, ?string $keyword): string
    {
        $score = 0;
        $titleLen = strlen((string) $title);
        $metaLen = strlen((string) $meta);

        if ($titleLen >= 35 && $titleLen <= 70) {
            $score++;
        }
        if ($metaLen >= 120 && $metaLen <= 170) {
            $score++;
        }
        if (! empty($keyword)) {
            $score++;
        }

        return match (true) {
            $score >= 3 => 'High',
            $score === 2 => 'Medium',
            default => 'Low',
        };
    }

    private function generateSeoSuggestions(?string $title, ?string $meta, ?string $keyword): array
    {
        $suggestions = [];
        $titleLen = strlen((string) $title);
        $metaLen = strlen((string) $meta);

        if ($titleLen < 35 || $titleLen > 70) {
            $suggestions[] = 'SEO title length should be between 35-70 chars.';
        }
        if ($metaLen < 120 || $metaLen > 170) {
            $suggestions[] = 'Meta description should be between 120-170 chars.';
        }
        if (empty($keyword)) {
            $suggestions[] = 'Focus keyword missing.';
        }

        return $suggestions;
    }

    private function renderForm(?BlogPost $post = null): Response
    {
        return Inertia::render('Admin/Blogs/Create', [
            'categories' => BlogCategory::query()->select('id', 'name')->orderBy('name')->get(),
            'tags' => BlogTag::query()->select('id', 'name')->orderBy('name')->get(),
            'authors' => \App\Models\User::query()->select('id', 'name')->orderBy('name')->get(),
            'post' => $post ? [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'featured_image' => $post->featured_image,
                'status' => $post->status,
                'published_at' => optional($post->published_at)->format('Y-m-d\TH:i'),
                'seo_meta_title' => $post->seo_meta_title,
                'seo_meta_description' => $post->seo_meta_description,
                'author_id' => $post->created_by,
                'category_ids' => $post->categories->pluck('id')->all(),
                'tag_ids' => $post->tags->pluck('id')->all(),
                'tag_names' => $post->tags->pluck('name')->implode(', '),
                'meta_keywords' => $post->seoMeta?->meta_keywords ?? '',
                'canonical_url' => $post->seoMeta?->canonical_url ?? '',
                'robots' => $this->robotsStringFromSeoMeta($post->seoMeta),
                'og_title' => $post->seoMeta?->og_title ?? '',
                'og_description' => $post->seoMeta?->og_description ?? '',
                'twitter_title' => $post->seoMeta?->twitter_title ?? '',
                'twitter_description' => $post->seoMeta?->twitter_description ?? '',
                'include_in_sitemap' => $post->seoMeta?->include_in_sitemap ?? true,
                'schema_type' => $post->seoMeta?->schema_type ?: 'BlogPosting',
                'schema_json' => $post->seoMeta?->json_ld ?? '',
            ] : null,
        ]);
    }

    private function validatePayload(Request $request, ?BlogPost $blog = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:190', Rule::unique('blog_posts', 'slug')->ignore($blog?->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'featured_image' => ['nullable', 'image', 'max:4096'],
            'featured_image_existing' => ['nullable', 'string', 'max:300'],
            'status' => ['required', Rule::in(['draft', 'published', 'scheduled'])],
            'published_at' => ['nullable', 'date'],
            'seo_meta_title' => ['nullable', 'string', 'max:190'],
            'seo_meta_description' => ['nullable', 'string', 'max:300'],
            'is_popular' => ['boolean'],
            'author_id' => ['nullable', 'exists:users,id'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:blog_tags,id'],
            'tag_names' => ['nullable', 'string', 'max:2000'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:blog_categories,id'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'robots' => ['nullable', Rule::in(['index,follow', 'index,nofollow', 'noindex,follow', 'noindex,nofollow'])],
            'og_title' => ['nullable', 'string', 'max:190'],
            'og_description' => ['nullable', 'string', 'max:300'],
            'twitter_title' => ['nullable', 'string', 'max:190'],
            'twitter_description' => ['nullable', 'string', 'max:300'],
            'include_in_sitemap' => ['boolean'],
            'schema_type' => ['nullable', 'string', 'max:80'],
            'schema_json' => ['nullable', 'string', 'max:20000'],
        ]);
    }

    private function preparePayload(array $validated, Request $request, ?BlogPost $blog = null): array
    {
        $slugSource = trim((string) ($validated['slug'] ?? ''));
        $slug = $slugSource !== '' ? Str::slug($slugSource) : Str::slug($validated['title']);

        $payload = [
            'blog_category_id' => ! empty($validated['category_ids']) ? (int) $validated['category_ids'][0] : null,
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $this->sanitizeBlogHtml((string) $validated['content']),
            'status' => $validated['status'],
            'published_at' => $validated['published_at'] ?? null,
            'seo_meta_title' => $validated['seo_meta_title'] ?? null,
            'seo_meta_description' => $validated['seo_meta_description'] ?? null,
            'is_popular' => (bool) ($validated['is_popular'] ?? false),
        ];

        if ($request->hasFile('featured_image')) {
            $this->imageVariantManager->deleteWithVariants($blog?->featured_image, 'public');
            $payload['featured_image'] = $this->imageVariantManager->storeWithVariants($request->file('featured_image'), 'blog', 'public');
        } else {
            $payload['featured_image'] = $validated['featured_image_existing'] ?? $blog?->featured_image;
        }

        if ($payload['status'] === 'published' && empty($payload['published_at'])) {
            $payload['published_at'] = now();
        }

        if ($payload['status'] === 'scheduled' && empty($payload['published_at'])) {
            $payload['published_at'] = now()->addHour();
        }

        if ($payload['status'] === 'draft') {
            $payload['published_at'] = null;
        }

        return $payload;
    }

    private function sanitizeBlogHtml(string $html): string
    {
        $allowed = '<p><br><h1><h2><h3><ul><ol><li><a><img><blockquote><pre><code><strong><b><em><i><u><span><div><hr>';
        $clean = strip_tags($html, $allowed);

        // Remove inline event handlers and javascript: URLs.
        $clean = preg_replace('/\son\w+\s*=\s*"[^"]*"/i', '', $clean) ?? $clean;
        $clean = preg_replace("/\son\w+\s*=\s*'[^']*'/i", '', $clean) ?? $clean;
        $clean = preg_replace('/\s(href|src)\s*=\s*([\'"])\s*javascript:[^\'"]*\2/i', '', $clean) ?? $clean;

        // Remove script/style/object/embed tags if any slipped through.
        $clean = preg_replace('#<(script|style|iframe|object|embed)[^>]*>.*?</\1>#is', '', $clean) ?? $clean;

        return trim($clean);
    }

    private function resolveUniqueBlogSlug(string $seed, ?int $ignoreId = null): string
    {
        $base = Str::slug($seed) ?: 'untitled-draft';
        $slug = $base;
        $counter = 2;

        while (BlogPost::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function syncTaxonomies(BlogPost $post, array $validated): void
    {
        $tagIds = collect($validated['tag_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();
        $tagNames = collect(explode(',', (string) ($validated['tag_names'] ?? '')))
            ->map(fn ($name) => trim($name))
            ->filter()
            ->map(fn ($name) => mb_substr($name, 0, 120))
            ->unique()
            ->values();
        $newTagIds = $tagNames->map(function (string $name): int {
            $tag = BlogTag::query()->firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
            if ($tag->name !== $name) {
                $tag->name = $name;
                $tag->save();
            }

            return (int) $tag->id;
        });
        $allTagIds = $tagIds->merge($newTagIds)->unique()->values();
        $categoryIds = collect($validated['category_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();

        $post->tags()->sync($allTagIds->all());
        $post->categories()->sync($categoryIds->all());
    }

    private function syncSeoMeta(BlogPost $post, array $validated): void
    {
        $robots = (string) ($validated['robots'] ?? 'index,follow');
        $robotsIndex = ! str_contains($robots, 'noindex');
        $robotsFollow = ! str_contains($robots, 'nofollow');
        $schemaType = trim((string) ($validated['schema_type'] ?? '')) ?: 'BlogPosting';
        $schemaJson = trim((string) ($validated['schema_json'] ?? ''));
        if ($schemaJson === '') {
            $schemaJson = $this->generateBlogSchema($post, $schemaType);
        }

        SeoMeta::query()->updateOrCreate(
            [
                'entity_type' => 'blog_post',
                'entity_id' => $post->id,
                'page_key' => '',
            ],
            [
                'slug' => $post->slug,
                'meta_title' => $validated['seo_meta_title'] ?? $post->seo_meta_title ?? null,
                'meta_description' => $validated['seo_meta_description'] ?? $post->seo_meta_description ?? null,
                'meta_keywords' => $validated['meta_keywords'] ?? null,
                'canonical_url' => $validated['canonical_url'] ?? null,
                'og_title' => $validated['og_title'] ?? null,
                'og_description' => $validated['og_description'] ?? null,
                'twitter_title' => $validated['twitter_title'] ?? null,
                'twitter_description' => $validated['twitter_description'] ?? null,
                'robots_index' => $robotsIndex,
                'robots_follow' => $robotsFollow,
                'include_in_sitemap' => (bool) ($validated['include_in_sitemap'] ?? true),
                'schema_type' => $schemaType,
                'json_ld' => $schemaJson,
            ]
        );
    }

    private function generateBlogSchema(BlogPost $post, string $schemaType): string
    {
        $payload = [
            '@context' => 'https://schema.org',
            '@type' => $schemaType ?: 'BlogPosting',
            'headline' => $post->title,
            'description' => $post->seo_meta_description ?: ($post->excerpt ?? ''),
            'datePublished' => optional($post->published_at)->toIso8601String(),
            'author' => [
                '@type' => 'Person',
                'name' => $post->author?->name ?? 'Admin Team',
            ],
            'image' => $post->featured_image ? [asset('storage/'.ltrim((string) $post->featured_image, '/'))] : [],
            'mainEntityOfPage' => route('blog.show', $post),
        ];

        return (string) json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    private function robotsStringFromSeoMeta(?SeoMeta $seoMeta): string
    {
        if (! $seoMeta) {
            return 'index,follow';
        }

        $index = $seoMeta->robots_index ? 'index' : 'noindex';
        $follow = $seoMeta->robots_follow ? 'follow' : 'nofollow';

        return "{$index},{$follow}";
    }

    private function logBlogActivity(Request $request, string $action, BlogPost $post, array $meta = []): void
    {
        ActivityLog::query()->create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'module' => 'blogs',
            'target_type' => BlogPost::class,
            'target_id' => $post->id,
            'meta' => $meta,
        ]);
    }
}
