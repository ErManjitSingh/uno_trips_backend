<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PackageImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageImageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PackageImage::query()->with('package:id,title')->latest()->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tour_package_id' => ['required', 'exists:tour_packages,id'],
            'image' => ['required', 'string', 'max:300'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['boolean'],
        ]);

        $image = PackageImage::query()->create($data);

        return response()->json($image, 201);
    }

    public function show(PackageImage $packageImage): JsonResponse
    {
        return response()->json($packageImage->load('package:id,title'));
    }

    public function update(Request $request, PackageImage $packageImage): JsonResponse
    {
        $data = $request->validate([
            'tour_package_id' => ['sometimes', 'exists:tour_packages,id'],
            'image' => ['sometimes', 'string', 'max:300'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['boolean'],
        ]);

        $packageImage->update($data);

        return response()->json($packageImage->fresh());
    }

    public function destroy(PackageImage $packageImage): JsonResponse
    {
        $packageImage->delete();

        return response()->json(['message' => 'Package image deleted']);
    }
}

