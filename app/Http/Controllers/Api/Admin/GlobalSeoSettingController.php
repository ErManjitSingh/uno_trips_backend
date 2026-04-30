<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GlobalSeoSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSeoSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(GlobalSeoSetting::query()->latest()->paginate(10));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:190'],
            'default_meta_title' => ['nullable', 'string', 'max:190'],
            'default_meta_description' => ['nullable', 'string'],
            'robots_txt' => ['nullable', 'string'],
            'sitemap_auto' => ['boolean'],
            'google_analytics_code' => ['nullable', 'string'],
        ]);

        $setting = GlobalSeoSetting::query()->create($data);

        return response()->json($setting, 201);
    }

    public function show(GlobalSeoSetting $globalSeoSetting): JsonResponse
    {
        return response()->json($globalSeoSetting);
    }

    public function update(Request $request, GlobalSeoSetting $globalSeoSetting): JsonResponse
    {
        $data = $request->validate([
            'site_name' => ['sometimes', 'string', 'max:190'],
            'default_meta_title' => ['nullable', 'string', 'max:190'],
            'default_meta_description' => ['nullable', 'string'],
            'robots_txt' => ['nullable', 'string'],
            'sitemap_auto' => ['boolean'],
            'google_analytics_code' => ['nullable', 'string'],
        ]);

        $globalSeoSetting->update($data);

        return response()->json($globalSeoSetting->fresh());
    }

    public function destroy(GlobalSeoSetting $globalSeoSetting): JsonResponse
    {
        $globalSeoSetting->delete();

        return response()->json(['message' => 'Global SEO setting deleted']);
    }
}

