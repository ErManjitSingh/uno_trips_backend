<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingPageResource;
use App\Http\Resources\ListingPageShowResource;
use App\Models\BlogPost;
use App\Models\ListingPage;
use App\Services\ListingPageQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingPageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = ListingPage::query()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->latest()
            ->get();

        return response()->json(ListingPageResource::collection($pages));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'slug' => ['required', 'string', 'max:210', 'unique:listing_pages,slug'],
            'page_type' => ['required', 'in:destination,seasonal,theme,custom'],
            'status' => ['required', 'in:active,inactive'],
            'filters_json' => ['nullable', 'array'],
            'meta_title' => ['nullable', 'string', 'max:190'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'meta_keywords' => ['nullable', 'string', 'max:600'],
            'canonical_url' => ['nullable', 'string', 'max:300'],
            'schema_json' => ['nullable', 'string'],
        ]);

        $page = ListingPage::query()->create($validated);

        return (new ListingPageResource($page))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, string $slug, ListingPageQueryService $queryService): JsonResponse
    {
        $isPreview = $request->boolean('preview') && $request->user('sanctum');

        $page = ListingPage::query()
            ->where('slug', $slug)
            ->when(! $isPreview, fn ($query) => $query->where('status', 'active'))
            ->firstOrFail();

        $packages = $queryService->resolvePackages($page);
        $blogIds = collect($page->blogs_json['ids'] ?? [])->map(fn ($id) => (int) $id)->filter()->values();
        $blogs = BlogPost::query()
            ->whereIn('id', $blogIds)
            ->get(['id', 'title', 'slug', 'excerpt', 'featured_image'])
            ->sortBy(fn ($blog) => $blogIds->search($blog->id))
            ->values();

        $page->setAttribute('packages', $packages);
        $page->setAttribute('related_blogs', $blogs);

        return response()->json(new ListingPageShowResource($page));
    }
}
