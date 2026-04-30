<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoMeta;
use App\Models\SeoSocial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeoMetaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(SeoMeta::query()->with('social')->latest()->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'seoable_id' => ['nullable', 'integer'],
            'seoable_type' => ['nullable', 'string', 'max:190'],
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'meta_keywords' => ['nullable', 'string'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'slug' => ['nullable', 'string', 'max:190'],
            'robots' => ['nullable', 'string', 'max:30'],
            'schema_json' => ['nullable', 'array'],
            'social' => ['nullable', 'array'],
            'social.og_title' => ['nullable', 'string', 'max:190'],
            'social.og_description' => ['nullable', 'string'],
            'social.og_image' => ['nullable', 'string', 'max:300'],
            'social.og_url' => ['nullable', 'string', 'max:300'],
            'social.twitter_title' => ['nullable', 'string', 'max:190'],
            'social.twitter_description' => ['nullable', 'string'],
            'social.twitter_image' => ['nullable', 'string', 'max:300'],
        ]);

        $meta = SeoMeta::query()->create($data);
        if (! empty($data['social'])) {
            $meta->social()->create($data['social']);
        }

        return response()->json($meta->load('social'), 201);
    }

    public function show(SeoMeta $seoMetum): JsonResponse
    {
        return response()->json($seoMetum->load('social'));
    }

    public function update(Request $request, SeoMeta $seoMetum): JsonResponse
    {
        $data = $request->validate([
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'meta_keywords' => ['nullable', 'string'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'slug' => ['nullable', 'string', 'max:190'],
            'robots' => ['nullable', 'string', 'max:30'],
            'schema_json' => ['nullable', 'array'],
            'social' => ['nullable', 'array'],
            'social.og_title' => ['nullable', 'string', 'max:190'],
            'social.og_description' => ['nullable', 'string'],
            'social.og_image' => ['nullable', 'string', 'max:300'],
            'social.og_url' => ['nullable', 'string', 'max:300'],
            'social.twitter_title' => ['nullable', 'string', 'max:190'],
            'social.twitter_description' => ['nullable', 'string'],
            'social.twitter_image' => ['nullable', 'string', 'max:300'],
        ]);

        $seoMetum->update($data);
        if (array_key_exists('social', $data)) {
            SeoSocial::query()->updateOrCreate(['seo_meta_id' => $seoMetum->id], $data['social']);
        }

        return response()->json($seoMetum->fresh()->load('social'));
    }

    public function destroy(SeoMeta $seoMetum): JsonResponse
    {
        $seoMetum->delete();

        return response()->json(['message' => 'SEO meta deleted']);
    }
}

