<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Support\ImageVariantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaLibraryController extends Controller
{
    public function __construct(private readonly ImageVariantManager $imageVariantManager) {}
    public function index(Request $request): Response
    {
        $folder = (string) $request->query('folder', 'general');

        return Inertia::render('Admin/Media/Index', [
            'folder' => $folder,
            'assets' => MediaAsset::query()
                ->when($folder, fn ($query) => $query->where('folder', $folder))
                ->latest()
                ->paginate(24)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'folder' => ['required', 'string', 'max:80'],
            'asset' => ['required', 'image', 'max:4096'],
            'alt_text' => ['nullable', 'string', 'max:180'],
        ]);

        $file = $validated['asset'];
        $path = $this->imageVariantManager->storeWithVariants($file, 'media/'.$validated['folder'], 'public');
        $absolute = Storage::disk('public')->path($path);

        MediaAsset::query()->create([
            'folder' => $validated['folder'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => @mime_content_type($absolute) ?: 'image/webp',
            'file_size' => (int) (Storage::disk('public')->size($path) ?: 0),
            'alt_text' => $validated['alt_text'] ?? null,
        ]);

        return back()->with('success', 'Media uploaded.');
    }

    public function destroy(MediaAsset $media): RedirectResponse
    {
        if ($media->file_path) {
            $this->imageVariantManager->deleteWithVariants($media->file_path, 'public');
        }
        $media->delete();

        return back()->with('success', 'Media deleted.');
    }
}
