<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Services\SeoResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BlogController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = Cache::remember('web.blog.categories', now()->addMinutes(10), function () {
            return BlogCategory::query()->orderBy('name')->get(['id', 'name', 'slug']);
        });

        return response()->json(['categories' => $categories]);
    }

    public function index(Request $request, SeoResolver $seoResolver): JsonResponse
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $perPage = $filters['per_page'] ?? 9;

        $query = BlogPost::query()
            ->where('status', 'published')
            ->with('category:id,name,slug')
            ->latest('published_at');

        if (! empty($filters['category'])) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $filters['category']));
        }

        return response()->json([
            'seo' => $seoResolver->forPage('blog', [
                'title' => 'UNO Trips Blog',
                'description' => 'Latest travel guides and destination stories.',
                'canonical_url' => route('blog.index'),
            ]),
            'posts' => $query->paginate($perPage)->withQueryString(),
        ]);
    }

    public function show(string $slug, SeoResolver $seoResolver): JsonResponse
    {
        $blogPost = BlogPost::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $blogPost->load('category:id,name,slug');

        $related = BlogPost::query()
            ->where('status', 'published')
            ->where('blog_category_id', $blogPost->blog_category_id)
            ->where('id', '!=', $blogPost->id)
            ->latest('published_at')
            ->limit(3)
            ->get(['id', 'title', 'slug', 'featured_image', 'published_at']);

        return response()->json([
            'seo' => $seoResolver->forModel('blog_post', $blogPost->id, [
                'title' => $blogPost->seo_meta_title ?: $blogPost->title,
                'description' => $blogPost->seo_meta_description ?: ($blogPost->excerpt ?? ''),
                'canonical_url' => route('blog.show', $blogPost),
            ]),
            'post' => $blogPost,
            'related' => $related,
        ]);
    }
}
