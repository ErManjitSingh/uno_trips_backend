<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Support\ImageUploadRules;
use App\Support\ImageVariantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaLibraryController extends Controller
{
    public function __construct(private readonly ImageVariantManager $imageVariantManager) {}
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', MediaAsset::class);

        $user = $request->user();
        $execPrefix = $user->isExecutive() ? 'exec-'.$user->id : null;
        $defaultFolder = $execPrefix ?? 'general';
        $folder = (string) $request->query('folder', $defaultFolder);

        if ($execPrefix !== null && ! str_starts_with($folder, $execPrefix)) {
            $folder = $execPrefix;
        }

        $query = MediaAsset::query()
            ->when($user->isExecutive(), fn ($q) => $q->where('uploaded_by', $user->id))
            ->when($folder !== '', fn ($q) => $q->where('folder', $folder));

        return Inertia::render('Admin/Media/Index', [
            'folder' => $folder,
            'assets' => $query
                ->latest()
                ->paginate(24)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', MediaAsset::class);

        $validated = $request->validate([
            'folder' => ['required', 'string', 'max:80'],
            'asset' => ['required', 'image', ImageUploadRules::maxFileRule()],
            'alt_text' => ['nullable', 'string', 'max:180'],
        ]);

        $user = $request->user();
        $folder = $user->isExecutive()
            ? 'exec-'.$user->id
            : $validated['folder'];

        $file = $validated['asset'];
        $path = $this->imageVariantManager->storeWithVariants($file, 'media/'.$folder, 'public');
        $absolute = Storage::disk('public')->path($path);

        $payload = [
            'folder' => $folder,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => @mime_content_type($absolute) ?: 'image/webp',
            'file_size' => (int) (Storage::disk('public')->size($path) ?: 0),
            'alt_text' => $validated['alt_text'] ?? null,
        ];

        if (Schema::hasColumn('media_assets', 'uploaded_by')) {
            $payload['uploaded_by'] = $user->id;
        }

        MediaAsset::query()->create($payload);

        return back()->with('success', 'Media uploaded.');
    }

    public function destroy(MediaAsset $media): RedirectResponse
    {
        Gate::authorize('delete', $media);

        if ($media->file_path) {
            $this->imageVariantManager->deleteWithVariants($media->file_path, 'public');
        }
        $media->delete();

        return back()->with('success', 'Media deleted.');
    }
}
