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

    /**
     * Prefix for root-relative URLs when the app lives in a subdirectory.
     * Prefer the request base path; if empty, derive from {@see config('app.url')} path.
     */
    private static function urlPathPrefix(Request $request): string
    {
        $fromRequest = rtrim($request->getBasePath(), '/');
        if ($fromRequest !== '') {
            return $fromRequest;
        }

        $appUrl = (string) config('app.url', '');
        if ($appUrl === '') {
            return '';
        }

        $path = parse_url($appUrl, PHP_URL_PATH);
        if (! is_string($path) || $path === '' || $path === '/') {
            return '';
        }

        return rtrim($path, '/');
    }

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            /** Root-relative paths (XAMPP /public, or subdirectory from APP_URL when request base is empty). */
            'base_path' => static fn () => self::urlPathPrefix($request),
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
            /** Database notifications badge (admin panel bell). */
            'unread_notifications_count' => static function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return 0;
                }
                if (! Schema::hasTable('notifications')) {
                    return 0;
                }
                try {
                    return (int) $user->unreadNotifications()->count();
                } catch (\Throwable) {
                    return 0;
                }
            },
        ];
    }
}
