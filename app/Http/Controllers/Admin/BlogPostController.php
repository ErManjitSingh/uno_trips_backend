<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Support\ImageVariantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
                ->with(['tags:id,name', 'categories:id,name'])
                ->first();
        }

        return $this->renderForm($post);
    }

    public function edit(BlogPost $blog): Response
    {
        $blog->load(['tags:id,name', 'categories:id,name']);

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
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:blog_categories,id'],
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
            'content' => $validated['content'],
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

    private function syncTaxonomies(BlogPost $post, array $validated): void
    {
        $tagIds = collect($validated['tag_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();
        $categoryIds = collect($validated['category_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();

        $post->tags()->sync($tagIds->all());
        $post->categories()->sync($categoryIds->all());
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
