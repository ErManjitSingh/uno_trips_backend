<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TourPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TourPackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = TourPackage::query()->with(['creator:id,name'])->latest()->paginate(20);

        return response()->json($packages);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'slug' => ['nullable', 'string', 'max:190', 'unique:tour_packages,slug'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:150'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'string', 'max:80'],
            'max_people' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'featured' => ['boolean'],
            'created_by' => ['nullable', 'exists:users,id'],
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
        $package = TourPackage::query()->create($data);

        return response()->json($package, 201);
    }

    public function show(TourPackage $tourPackage): JsonResponse
    {
        return response()->json($tourPackage->load(['images', 'bookings', 'reviews', 'seoMeta.social']));
    }

    public function update(Request $request, TourPackage $tourPackage): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:190'],
            'slug' => ['nullable', 'string', 'max:190', Rule::unique('tour_packages', 'slug')->ignore($tourPackage->id)],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:150'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'string', 'max:80'],
            'max_people' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'featured' => ['boolean'],
            'created_by' => ['nullable', 'exists:users,id'],
        ]);

        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $tourPackage->update($data);

        return response()->json($tourPackage->fresh());
    }

    public function destroy(TourPackage $tourPackage): JsonResponse
    {
        $tourPackage->delete();

        return response()->json(['message' => 'Package deleted']);
    }
}

