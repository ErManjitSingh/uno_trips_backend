<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\TourPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DestinationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $onlyFeatured = $request->boolean('featured');

        $query = Destination::query()->orderBy('name');

        if ($onlyFeatured) {
            $query->where('is_featured', true);
        }

        return response()->json([
            'destinations' => $query->get([
                'id',
                'name',
                'slug',
                'country',
                'hero_image',
                'is_featured',
                'seo_meta_title',
                'seo_meta_description',
            ]),
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $destination = Destination::query()->where('slug', $slug)->firstOrFail();

        $perPage = $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:50']])['per_page'] ?? 9;

        $packages = TourPackage::query()
            ->publiclyVisible()
            ->whereDestinationFilter($destination->name)
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'destination' => $destination,
            'packages' => $packages,
        ]);
    }
}
