<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Services\SeoResolver;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(SeoResolver $seoResolver): Response
    {
        return Inertia::render('Web/Blog/Index', [
            'seo' => $seoResolver->forPage('blog', [
                'title' => 'UNO Trips Blog',
                'description' => 'Latest travel guides and destination stories.',
                'canonical_url' => route('blog.index'),
            ]),
            'categories' => Cache::remember('web.blog.categories', now()->addMinutes(10), function () {
                return BlogCategory::query()->orderBy('name')->get(['id', 'name', 'slug']);
            }),
            'posts' => BlogPost::query()
                ->where('status', 'published')
                ->with('category:id,name,slug')
                ->latest('published_at')
                ->paginate(9),
        ]);
    }

    public function show(BlogPost $blogPost, SeoResolver $seoResolver): Response
    {
        return Inertia::render('Web/Blog/Show', [
            'seo' => $seoResolver->forModel('blog_post', $blogPost->id, [
                'title' => $blogPost->seo_meta_title ?: $blogPost->title,
                'description' => $blogPost->seo_meta_description ?: ($blogPost->excerpt ?? ''),
                'canonical_url' => route('blog.show', $blogPost),
            ]),
            'post' => $blogPost->load('category:id,name,slug'),
            'related' => BlogPost::query()
                ->where('status', 'published')
                ->where('blog_category_id', $blogPost->blog_category_id)
                ->where('id', '!=', $blogPost->id)
                ->latest('published_at')
                ->limit(3)
                ->get(['id', 'title', 'slug', 'featured_image', 'published_at']),
        ]);
    }
}
