<?php

namespace App\Http\Middleware;

use App\Enums\ApprovalStatus;
use App\Models\BlogPost;
use App\Models\TourPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            /** Root-relative fetch() paths (e.g. XAMPP /public or app in subdirectory). */
            'base_path' => fn () => rtrim($request->getBasePath(), '/'),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'max_upload_image_kb' => (int) config('filesystems.max_upload_image_kb', 500),
            'approval_pending_counts' => static function () use ($request) {
                $user = $request->user();
                if (! $user?->isSuperAdmin()) {
                    return null;
                }

                try {
                    $packages = 0;
                    $blogs = 0;

                    if (Schema::hasColumn('tour_packages', 'approval_status')) {
                        $packages = (int) TourPackage::query()
                            ->where('approval_status', ApprovalStatus::Pending->value)
                            ->count();
                    }

                    if (Schema::hasColumn('blog_posts', 'approval_status')) {
                        $blogs = (int) BlogPost::query()
                            ->where('approval_status', ApprovalStatus::Pending->value)
                            ->count();
                    }

                    return [
                        'packages' => $packages,
                        'blogs' => $blogs,
                    ];
                } catch (\Throwable) {
                    return null;
                }
            },
            /** Same-origin path (APP_URL / host mismatch safe; works in XAMPP subfolders via base_path). */
            'admin_hrefs' => static function () use ($request) {
                $prefix = rtrim($request->getBasePath(), '/');

                return [
                    'approvals' => $prefix === '' ? '/admin/approvals' : $prefix.'/admin/approvals',
                ];
            },
        ];
    }
}
