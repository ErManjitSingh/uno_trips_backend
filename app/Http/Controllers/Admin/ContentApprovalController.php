<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BlogPost;
use App\Models\TourPackage;
use App\Services\ContentApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ContentApprovalController extends Controller
{
    public function __construct(private readonly ContentApprovalService $approvalService)
    {
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $packageColumns = [
            'id',
            'title',
            'slug',
            'location_name',
            'destination',
            'duration',
            'days',
            'nights',
            'price',
            'offer_price',
            'status',
            'package_type',
            'short_description',
            'full_description',
            'featured_image',
            'itinerary',
            'inclusions',
            'exclusions',
            'created_by',
            'created_at',
            'updated_at',
        ];
        if (Schema::hasColumn('tour_packages', 'approval_status')) {
            $packageColumns[] = 'approval_status';
        }

        $packagesBase = TourPackage::query()
            ->with('creator:id,name,email')
            ->select($packageColumns);

        if (Schema::hasColumn('tour_packages', 'approval_status')) {
            $packagesBase->where('approval_status', 'pending');
        } else {
            $packagesBase->whereRaw('0 = 1');
        }

        $pendingPackages = $packagesBase->latest()->paginate(15, ['*'], 'packages_page');

        $blogColumns = [
            'id',
            'title',
            'slug',
            'excerpt',
            'status',
            'featured_image',
            'created_by',
            'created_at',
            'updated_at',
        ];
        if (Schema::hasColumn('blog_posts', 'approval_status')) {
            $blogColumns[] = 'approval_status';
        }

        $blogsBase = BlogPost::query()
            ->with('author:id,name,email')
            ->select($blogColumns);

        if (Schema::hasColumn('blog_posts', 'approval_status')) {
            $blogsBase->where('approval_status', 'pending');
        } else {
            $blogsBase->whereRaw('0 = 1');
        }

        $pendingBlogs = $blogsBase->latest()->paginate(15, ['*'], 'blogs_page');

        return Inertia::render('Admin/Approvals/Index', [
            'pendingPackages' => $pendingPackages,
            'pendingBlogs' => $pendingBlogs,
        ]);
    }

    public function approvePackage(Request $request, TourPackage $tourPackage): RedirectResponse
    {
        Gate::authorize('approve', $tourPackage);
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->approvalService->approvePackage($tourPackage, $request->user(), $data['remarks'] ?? null);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'package.approved',
            'module' => 'packages',
            'target_type' => TourPackage::class,
            'target_id' => $tourPackage->id,
            'meta' => ['title' => $tourPackage->title],
        ]);

        return back()->with('success', 'Package approved and published.');
    }

    public function rejectPackage(Request $request, TourPackage $tourPackage): RedirectResponse
    {
        Gate::authorize('approve', $tourPackage);
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->approvalService->rejectPackage($tourPackage, $request->user(), $data['remarks'] ?? null);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'package.rejected',
            'module' => 'packages',
            'target_type' => TourPackage::class,
            'target_id' => $tourPackage->id,
            'meta' => ['title' => $tourPackage->title],
        ]);

        return back()->with('success', 'Package rejected.');
    }

    public function approveBlog(Request $request, BlogPost $blog): RedirectResponse
    {
        Gate::authorize('approve', $blog);
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->approvalService->approveBlog($blog, $request->user(), $data['remarks'] ?? null);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'blog.approved',
            'module' => 'blogs',
            'target_type' => BlogPost::class,
            'target_id' => $blog->id,
            'meta' => ['title' => $blog->title],
        ]);

        return back()->with('success', 'Blog approved and published.');
    }

    public function rejectBlog(Request $request, BlogPost $blog): RedirectResponse
    {
        Gate::authorize('approve', $blog);
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->approvalService->rejectBlog($blog, $request->user(), $data['remarks'] ?? null);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'blog.rejected',
            'module' => 'blogs',
            'target_type' => BlogPost::class,
            'target_id' => $blog->id,
            'meta' => ['title' => $blog->title],
        ]);

        return back()->with('success', 'Blog rejected.');
    }

    public function bulkApprovePackages(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:tour_packages,id'],
        ]);

        $packages = TourPackage::query()->whereIn('id', $data['ids'])->where('approval_status', 'pending')->get();
        foreach ($packages as $package) {
            $this->approvalService->approvePackage($package, $request->user());
        }

        return back()->with('success', $packages->count().' package(s) approved.');
    }

    public function bulkApproveBlogs(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:blog_posts,id'],
        ]);

        $posts = BlogPost::query()->whereIn('id', $data['ids'])->where('approval_status', 'pending')->get();
        foreach ($posts as $post) {
            $this->approvalService->approveBlog($post, $request->user());
        }

        return back()->with('success', $posts->count().' blog(s) approved.');
    }
}
