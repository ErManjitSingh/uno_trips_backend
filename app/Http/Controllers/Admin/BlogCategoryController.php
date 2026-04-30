<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BlogCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = BlogCategory::query()
            ->withCount(['posts', 'linkedPosts'])
            ->orderBy('name')
            ->get()
            ->values()
            ->map(function (BlogCategory $category, int $index): array {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => null,
                    'seo_title' => null,
                    'seo_description' => null,
                    'posts_count' => (int) $category->posts_count + (int) $category->linked_posts_count,
                    'status' => 'Active',
                    'featured' => false,
                    'parent_id' => null,
                    'position' => $index + 1,
                ];
            });

        return Inertia::render('Admin/BlogCategories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:blog_categories,slug'],
        ]);

        BlogCategory::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
        ]);

        return back()->with('success', 'Category created.');
    }

    public function update(Request $request, BlogCategory $blogCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('blog_categories', 'slug')->ignore($blogCategory->id)],
        ]);

        $blogCategory->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(BlogCategory $blogCategory): RedirectResponse
    {
        $directPosts = $blogCategory->posts()->count();
        $mappedPosts = $blogCategory->linkedPosts()->count();

        if (($directPosts + $mappedPosts) > 0) {
            return back()->with('error', 'Cannot delete category that is linked to blog posts.');
        }

        $blogCategory->delete();

        return back()->with('success', 'Category deleted.');
    }
}
