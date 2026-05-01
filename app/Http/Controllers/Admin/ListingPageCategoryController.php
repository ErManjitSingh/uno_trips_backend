<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ListingPageCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ListingPageCategoryController extends Controller
{
    public function index(): Response
    {
        $filters = request()->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', Rule::in(['name_asc', 'name_desc', 'pages_desc', 'pages_asc'])],
        ]);

        $search = $filters['search'] ?? null;
        $sort = $filters['sort'] ?? 'name_asc';

        $query = ListingPageCategory::query()
            ->withCount('listingPages')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"));

        if ($sort === 'name_desc') {
            $query->orderByDesc('name');
        } elseif ($sort === 'pages_desc') {
            $query->orderByDesc('listing_pages_count')->orderBy('name');
        } elseif ($sort === 'pages_asc') {
            $query->orderBy('listing_pages_count')->orderBy('name');
        } else {
            $query->orderBy('name');
        }

        return Inertia::render('Admin/ListingPages/Categories', [
            'categories' => $query->paginate(12)->withQueryString(),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'sort' => $sort,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150', 'unique:listing_page_categories,slug'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        ListingPageCategory::query()->create([
            ...$validated,
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
            'sort_order' => ((int) ListingPageCategory::query()->max('sort_order')) + 1,
        ]);

        return back()->with('success', 'Listing category created.');
    }

    public function update(Request $request, ListingPageCategory $listingCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150', Rule::unique('listing_page_categories', 'slug')->ignore($listingCategory->id)],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $listingCategory->update([
            ...$validated,
            'slug' => $validated['slug'] ?? str($validated['name'])->slug()->toString(),
        ]);

        return back()->with('success', 'Listing category updated.');
    }

    public function toggleStatus(ListingPageCategory $listingCategory): RedirectResponse
    {
        $listingCategory->update([
            'status' => $listingCategory->status === 'active' ? 'inactive' : 'active',
        ]);

        return back()->with('success', 'Listing category status updated.');
    }

    public function destroy(ListingPageCategory $listingCategory): RedirectResponse
    {
        if ($listingCategory->listingPages()->exists()) {
            return back()->with('error', 'Cannot delete category with assigned listing pages.');
        }

        $listingCategory->delete();

        return back()->with('success', 'Listing category deleted.');
    }
}
