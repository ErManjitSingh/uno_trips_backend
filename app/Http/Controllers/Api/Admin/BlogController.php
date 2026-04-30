<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(BlogPost::query()->with('author:id,name,email')->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'slug' => ['nullable', 'string', 'max:190', 'unique:blog_posts,slug'],
            'content' => ['required', 'string'],
            'featured_image' => ['nullable', 'string', 'max:300'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'created_by' => ['nullable', 'exists:users,id'],
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
        $blog = BlogPost::query()->create($data);

        return response()->json($blog, 201);
    }

    public function show(BlogPost $blogPost): JsonResponse
    {
        return response()->json($blogPost->load(['author:id,name,email', 'seoMeta.social']));
    }

    public function update(Request $request, BlogPost $blogPost): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:190'],
            'slug' => ['nullable', 'string', 'max:190', Rule::unique('blog_posts', 'slug')->ignore($blogPost->id)],
            'content' => ['sometimes', 'string'],
            'featured_image' => ['nullable', 'string', 'max:300'],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'created_by' => ['nullable', 'exists:users,id'],
        ]);

        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $blogPost->update($data);

        return response()->json($blogPost->fresh());
    }

    public function destroy(BlogPost $blogPost): JsonResponse
    {
        $blogPost->delete();

        return response()->json(['message' => 'Blog deleted']);
    }
}

