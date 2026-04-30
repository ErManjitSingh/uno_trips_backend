<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeaturedPackageSetting;
use App\Models\TourPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class FeaturedPackageController extends Controller
{
    public function index(): Response
    {
        $settings = FeaturedPackageSetting::query()->firstOrCreate([], [
            'max_featured' => 4,
            'auto_rotate' => true,
        ]);

        $fallbackImages = [
            'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
        ];

        $packages = Cache::remember('admin.featured_packages.list', now()->addMinutes(3), function () use ($fallbackImages) {
            return TourPackage::query()
                ->orderByRaw('CASE WHEN featured_position IS NULL THEN 1 ELSE 0 END')
                ->orderBy('featured_position')
                ->latest('id')
                ->select(['id', 'title', 'price', 'featured_badge', 'is_popular', 'featured_position', 'is_featured', 'featured_image'])
                ->get()
                ->values()
                ->map(function (TourPackage $pkg, int $index) use ($fallbackImages): array {
                    return [
                        'id' => $pkg->id,
                        'name' => $pkg->title,
                        'price' => (float) $pkg->price,
                        'badge' => $pkg->featured_badge ?: ($pkg->is_popular ? 'Best Seller' : 'Trending'),
                        'position' => $pkg->featured_position ?: ($index + 1),
                        'is_featured' => (bool) $pkg->is_featured,
                        'image' => $pkg->featured_image ?: ($fallbackImages[$index % count($fallbackImages)]),
                    ];
                });
        });

        return Inertia::render('Admin/FeaturedPackages/Index', [
            'featuredPackages' => $packages,
            'settings' => $settings,
        ]);
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer', 'exists:tour_packages,id'],
        ]);

        foreach ($validated['ordered_ids'] as $index => $id) {
            TourPackage::query()->whereKey($id)->update(['featured_position' => $index + 1]);
        }
        $this->clearFeaturedCaches();

        return back()->with('success', 'Featured ranking updated.');
    }

    public function updateFeature(Request $request, TourPackage $package): RedirectResponse
    {
        $validated = $request->validate([
            'is_featured' => ['required', 'boolean'],
            'badge' => ['nullable', 'string', 'max:40'],
        ]);

        $settings = FeaturedPackageSetting::query()->firstOrCreate([], [
            'max_featured' => 4,
            'auto_rotate' => true,
        ]);

        if ($validated['is_featured']) {
            $currentFeaturedCount = TourPackage::query()
                ->where('is_featured', true)
                ->whereKeyNot($package->id)
                ->count();

            if ($currentFeaturedCount >= $settings->max_featured) {
                return back()->withErrors([
                    'featured' => 'Max featured package limit reached.',
                ]);
            }
        }

        $package->update([
            'is_featured' => $validated['is_featured'],
            'featured_badge' => $validated['badge'] ?: null,
        ]);

        if ($validated['is_featured'] && ! $package->featured_position) {
            $nextPosition = (TourPackage::query()->max('featured_position') ?? 0) + 1;
            $package->update(['featured_position' => $nextPosition]);
        }
        $this->clearFeaturedCaches();

        return back()->with('success', 'Featured package updated.');
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'max_featured' => ['required', 'integer', 'min:1', 'max:20'],
            'auto_rotate' => ['required', 'boolean'],
        ]);

        $settings = FeaturedPackageSetting::query()->firstOrCreate([], [
            'max_featured' => 4,
            'auto_rotate' => true,
        ]);
        $settings->update($validated);

        $featuredIds = TourPackage::query()
            ->where('is_featured', true)
            ->orderByRaw('CASE WHEN featured_position IS NULL THEN 1 ELSE 0 END')
            ->orderBy('featured_position')
            ->pluck('id');

        if ($featuredIds->count() > $validated['max_featured']) {
            $overflowIds = $featuredIds->slice($validated['max_featured'])->values();
            TourPackage::query()->whereIn('id', $overflowIds)->update(['is_featured' => false]);
        }
        $this->clearFeaturedCaches();

        return back()->with('success', 'Featured settings saved.');
    }

    private function clearFeaturedCaches(): void
    {
        Cache::forget('admin.featured_packages.list');
        Cache::forget('web.home.hero_packages');
    }
}
