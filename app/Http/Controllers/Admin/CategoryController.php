<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PackageCategory;
use App\Models\TourPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = PackageCategory::query()
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->values()
            ->map(function (PackageCategory $category): array {
                $packageCount = TourPackage::query()
                    ->where('primary_category', $category->name)
                    ->orWhereJsonContains('secondary_categories', $category->name)
                    ->count();

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'type' => $category->type,
                    'slug' => $category->slug,
                    'package_count' => $packageCount,
                    'status' => $category->status,
                    'featured' => $category->featured,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'description' => $category->description,
                    'seo_title' => $category->seo_title,
                    'seo_description' => $category->seo_description,
                    'parent_id' => $category->parent_id,
                    'position' => $category->position,
                ];
            });

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:package_categories,slug'],
            'type' => ['required', 'string', 'max:60'],
            'icon' => ['required', 'string', 'max:60'],
            'color' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'seo_title' => ['nullable', 'string', 'max:190'],
            'seo_description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
            'featured' => ['boolean'],
            'parent_id' => ['nullable', 'integer', 'exists:package_categories,id'],
        ]);

        PackageCategory::query()->create([
            ...$validated,
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
            'parent_id' => $validated['parent_id'] ?? null,
            'featured' => (bool) ($validated['featured'] ?? false),
            'position' => (int) PackageCategory::query()->max('position') + 1,
        ]);

        return back()->with('success', 'Category created.');
    }

    public function update(Request $request, PackageCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('package_categories', 'slug')->ignore($category->id)],
            'type' => ['required', 'string', 'max:60'],
            'icon' => ['required', 'string', 'max:60'],
            'color' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'seo_title' => ['nullable', 'string', 'max:190'],
            'seo_description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
            'featured' => ['boolean'],
            'parent_id' => ['nullable', 'integer', 'exists:package_categories,id'],
        ]);

        $category->update([
            ...$validated,
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
            'parent_id' => $validated['parent_id'] ?? null,
            'featured' => (bool) ($validated['featured'] ?? false),
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(PackageCategory $category): RedirectResponse
    {
        $linkedCount = TourPackage::query()
            ->where('primary_category', $category->name)
            ->orWhereJsonContains('secondary_categories', $category->name)
            ->count();

        if ($linkedCount > 0) {
            return back()->with('error', 'Cannot delete category used in packages.');
        }

        $category->delete();

        return back()->with('success', 'Category deleted.');
    }
}
