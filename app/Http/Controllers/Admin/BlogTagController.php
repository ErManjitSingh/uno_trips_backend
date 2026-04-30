<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogTag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogTagController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/BlogTags/Index', [
            'tags' => BlogTag::query()
                ->orderByDesc('usage_count')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'usage_count']),
            'suggestions' => ['Solo Travel', 'Packing Tips', 'Mountain Escape', 'Beach Holidays', 'Wildlife Tours'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140'],
        ]);

        $name = trim($validated['name']);
        $slug = trim((string) ($validated['slug'] ?? ''));
        $slug = $slug !== '' ? Str::slug($slug) : Str::slug($name);

        $existing = BlogTag::query()
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->first();

        if ($existing) {
            $existing->increment('usage_count');

            return back()->with('success', 'Tag already existed, usage count incremented.');
        }

        $slugExists = BlogTag::query()->where('slug', $slug)->exists();
        if ($slugExists) {
            return back()->withErrors([
                'name' => 'A tag with a similar slug already exists. Please choose a different name.',
            ]);
        }

        BlogTag::query()->create([
            'name' => $name,
            'slug' => $slug,
            'usage_count' => 1,
        ]);

        return back()->with('success', 'Tag added successfully.');
    }
}
