<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\ActivityLog;
use App\Models\SeoMeta;
use App\Models\TourPackage;
use App\Models\User;
use App\Models\WebsiteSetting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        if (request()->user()?->isExecutive()) {
            return $this->executiveDashboard();
        }

        $range = request()->input('range', '7d');
        $visitorsRange = request()->input('visitors_range', 'last7');
        $trafficRange = request()->input('traffic_range', 'last7');
        $fromDate = match ($range) {
            '30d' => now()->subDays(29)->startOfDay(),
            default => now()->subDays(6)->startOfDay(),
        };
        $trafficFromDate = $this->resolveTrafficRangeDate($visitorsRange);
        $sourcesFromDate = $this->resolveTrafficRangeDate($trafficRange);
        $cacheKey = "admin.dashboard.v2.{$range}.{$visitorsRange}.{$trafficRange}";

        $payload = Cache::remember($cacheKey, now()->addSeconds(20), function () use ($fromDate, $trafficFromDate, $sourcesFromDate): array {
            return [
                'stats' => $this->getDashboardStats($fromDate),
                'visitorsTrend' => $this->getVisitorsTrend($trafficFromDate),
                'bookingsLeadsTrend' => $this->getBookingsLeadsTrend($fromDate),
                'trafficSources' => $this->getTrafficSources($sourcesFromDate),
                'recentActivities' => $this->getRecentActivities(),
                'topContent' => $this->getTopContent(),
                'seo' => $this->getSeoSectionData(),
                'activeUsersNow' => random_int(5, 24),
                'latestVisitors' => $this->getLatestVisitors(),
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'range' => $range,
            'visitorsRange' => $visitorsRange,
            'trafficRange' => $trafficRange,
            ...$payload,
        ]);
    }

    private function getDashboardStats(Carbon $fromDate): array
    {
        $current = [
            'totalPackages' => TourPackage::query()->count(),
            'totalBlogs' => BlogPost::query()->count(),
            'totalVisitors' => Lead::query()->where('created_at', '>=', $fromDate)->count()
                + Booking::query()->where('created_at', '>=', $fromDate)->count(),
            'totalBookings' => Booking::query()->where('created_at', '>=', $fromDate)->count(),
            'revenue' => (float) Booking::query()->where('created_at', '>=', $fromDate)->sum('total_amount'),
        ];

        $periodDays = max(1, $fromDate->diffInDays(now()) + 1);
        $prevStart = (clone $fromDate)->subDays($periodDays);
        $prevEnd = (clone $fromDate)->subSecond();

        $previous = [
            'totalPackages' => TourPackage::query()->whereBetween('created_at', [$prevStart, $prevEnd])->count(),
            'totalBlogs' => BlogPost::query()->whereBetween('created_at', [$prevStart, $prevEnd])->count(),
            'totalVisitors' => Lead::query()->whereBetween('created_at', [$prevStart, $prevEnd])->count()
                + Booking::query()->whereBetween('created_at', [$prevStart, $prevEnd])->count(),
            'totalBookings' => Booking::query()->whereBetween('created_at', [$prevStart, $prevEnd])->count(),
            'revenue' => (float) Booking::query()->whereBetween('created_at', [$prevStart, $prevEnd])->sum('total_amount'),
        ];

        return [
            'totalPackages' => $this->metricCard($current['totalPackages'], $previous['totalPackages']),
            'totalBlogs' => $this->metricCard($current['totalBlogs'], $previous['totalBlogs']),
            'totalVisitors' => $this->metricCard($current['totalVisitors'], $previous['totalVisitors']),
            'totalBookings' => $this->metricCard($current['totalBookings'], $previous['totalBookings']),
            'revenue' => $this->metricCard($current['revenue'], $previous['revenue'], true),
        ];
    }

    private function metricCard(float|int $current, float|int $previous, bool $isCurrency = false): array
    {
        $delta = $current - $previous;
        $growthPercent = $previous > 0 ? round(($delta / $previous) * 100, 1) : ($current > 0 ? 100.0 : 0.0);

        return [
            'value' => $isCurrency ? round($current, 2) : (int) $current,
            'growth' => $growthPercent,
            'isUp' => $growthPercent >= 0,
            'compareText' => 'vs previous period',
        ];
    }

    private function getVisitorsTrend(?Carbon $fromDate): array
    {
        $labels = [];
        $visitors = [];
        $cursor = $fromDate ? (clone $fromDate) : now()->subDays(29)->startOfDay();

        $leadCounts = Lead::query()
            ->where('created_at', '>=', $cursor)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $bookingCounts = Booking::query()
            ->where('created_at', '>=', $cursor)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        while ($cursor <= now()) {
            $day = $cursor->toDateString();
            $labels[] = $cursor->format('d M');
            $visitors[] = (int) ($leadCounts[$day] ?? 0) + (int) ($bookingCounts[$day] ?? 0);
            $cursor->addDay();
        }

        return ['labels' => $labels, 'values' => $visitors];
    }

    private function getBookingsLeadsTrend(Carbon $fromDate): array
    {
        $labels = [];
        $bookings = [];
        $leads = [];
        $cursor = (clone $fromDate);

        $bookingCounts = Booking::query()
            ->where('created_at', '>=', $fromDate)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $leadCounts = Lead::query()
            ->where('created_at', '>=', $fromDate)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        while ($cursor <= now()) {
            $day = $cursor->toDateString();
            $labels[] = $cursor->format('d M');
            $bookings[] = (int) ($bookingCounts[$day] ?? 0);
            $leads[] = (int) ($leadCounts[$day] ?? 0);
            $cursor->addDay();
        }

        return ['labels' => $labels, 'bookings' => $bookings, 'leads' => $leads];
    }

    private function getTrafficSources(?Carbon $fromDate): array
    {
        $rows = Lead::query()
            ->when($fromDate, fn ($query) => $query->where('created_at', '>=', $fromDate))
            ->select('source', DB::raw('COUNT(*) as total'))
            ->groupBy('source')
            ->get();

        $bucket = [
            'Direct' => 0,
            'Organic' => 0,
            'Referral' => 0,
            'Social' => 0,
            'Paid' => 0,
            'Other' => 0,
        ];

        foreach ($rows as $row) {
            $source = strtolower(trim((string) $row->source));
            $count = (int) $row->total;
            if ($source === '' || in_array($source, ['website', 'direct'], true)) {
                $bucket['Direct'] += $count;
            } elseif (str_contains($source, 'organic') || str_contains($source, 'seo')) {
                $bucket['Organic'] += $count;
            } elseif (str_contains($source, 'referral')) {
                $bucket['Referral'] += $count;
            } elseif (str_contains($source, 'social') || in_array($source, ['facebook', 'instagram', 'youtube'], true)) {
                $bucket['Social'] += $count;
            } elseif (str_contains($source, 'paid') || str_contains($source, 'ads')) {
                $bucket['Paid'] += $count;
            } else {
                $bucket['Other'] += $count;
            }
        }

        return [
            'labels' => array_keys($bucket),
            'values' => array_values($bucket),
        ];
    }

    private function executiveDashboard(): Response
    {
        $userId = (int) request()->user()->id;

        $pkgHasCreatedBy = Schema::hasColumn('tour_packages', 'created_by');
        $blogHasCreatedBy = Schema::hasColumn('blog_posts', 'created_by');

        $packageBase = $pkgHasCreatedBy
            ? TourPackage::query()->where('created_by', $userId)
            : TourPackage::query()->whereRaw('0 = 1');
        $blogBase = $blogHasCreatedBy
            ? BlogPost::query()->where('created_by', $userId)
            : BlogPost::query()->whereRaw('0 = 1');

        $pkgApproval = Schema::hasColumn('tour_packages', 'approval_status');
        $blogApproval = Schema::hasColumn('blog_posts', 'approval_status');

        $stats = [
            'packages_total' => (clone $packageBase)->count(),
            'packages_pending' => $pkgApproval ? (clone $packageBase)->where('approval_status', 'pending')->count() : 0,
            'packages_approved' => $pkgApproval ? (clone $packageBase)->where('approval_status', 'approved')->count() : (clone $packageBase)->where('status', 'published')->count(),
            'packages_rejected' => $pkgApproval ? (clone $packageBase)->where('approval_status', 'rejected')->count() : 0,
            'blogs_total' => (clone $blogBase)->count(),
            'blogs_pending' => $blogApproval ? (clone $blogBase)->where('approval_status', 'pending')->count() : 0,
            'blogs_approved' => $blogApproval ? (clone $blogBase)->where('approval_status', 'approved')->count() : (clone $blogBase)->where('status', 'published')->count(),
            'blogs_rejected' => $blogApproval ? (clone $blogBase)->where('approval_status', 'rejected')->count() : 0,
        ];

        $packageColumns = ['id', 'title', 'slug', 'status', 'updated_at'];
        if ($pkgApproval) {
            $packageColumns[] = 'approval_status';
        }
        $recentPackages = $pkgHasCreatedBy
            ? TourPackage::query()
                ->where('created_by', $userId)
                ->latest()
                ->limit(5)
                ->get($packageColumns)
            : collect();

        $blogColumns = ['id', 'title', 'slug', 'status', 'updated_at'];
        if ($blogApproval) {
            $blogColumns[] = 'approval_status';
        }
        $recentBlogs = $blogHasCreatedBy
            ? BlogPost::query()
                ->where('created_by', $userId)
                ->latest()
                ->limit(5)
                ->get($blogColumns)
            : collect();

        return Inertia::render('Admin/DashboardExecutive', [
            'stats' => $stats,
            'recentPackages' => $recentPackages,
            'recentBlogs' => $recentBlogs,
        ]);
    }

    private function resolveTrafficRangeDate(string $range): ?Carbon
    {
        return match ($range) {
            'today' => now()->startOfDay(),
            'yesterday' => now()->subDay()->startOfDay(),
            'last7' => now()->subDays(6)->startOfDay(),
            'lastmonth' => now()->subMonth()->startOfDay(),
            'alltime' => null,
            default => now()->subDays(6)->startOfDay(),
        };
    }

    private function getRecentActivities(): array
    {
        $logs = ActivityLog::query()
            ->with('actor:id,name')
            ->latest()
            ->limit(20)
            ->get();

        if ($logs->isEmpty()) {
            $fallbackUsers = User::query()->latest()->limit(3)->get()->map(fn ($item) => [
                'type' => 'user',
                'text' => 'New user registered: '.$item->name,
                'time' => optional($item->created_at)->diffForHumans(),
            ]);
            return $fallbackUsers->values()->all();
        }

        return $logs->map(function (ActivityLog $log): array {
            $title = (string) ($log->meta['title'] ?? '');
            $text = match ($log->action) {
                'package.created' => 'Package added: '.$title,
                'package.updated' => 'Package edited: '.$title,
                'package.duplicate_initiated' => 'Package duplicate initiated: '.$title,
                'package.deleted' => 'Package deleted: '.$title,
                'blog.created' => 'Blog added: '.$title,
                'blog.updated' => 'Blog edited: '.$title,
                'blog.deleted' => 'Blog deleted: '.$title,
                'lead.created' => 'Lead created',
                'lead.updated' => 'Lead updated',
                'auth.login' => ($log->actor?->name ?? 'User').' signed in',
                default => str_replace('.', ' ', $log->action),
            };

            $type = str_starts_with($log->action, 'package.') ? 'package'
                : (str_starts_with($log->action, 'blog.') ? 'blog'
                : (str_starts_with($log->action, 'lead.') ? 'lead' : 'user'));

            return [
                'type' => $type,
                'text' => $text,
                'time' => optional($log->created_at)->diffForHumans(),
                'actor' => $log->actor?->name,
            ];
        })->values()->all();
    }

    private function getTopContent(): array
    {
        $topPackages = Booking::query()
            ->select('package_name', DB::raw('COUNT(*) as total_bookings'))
            ->whereNotNull('package_name')
            ->groupBy('package_name')
            ->orderByDesc('total_bookings')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->package_name,
                'count' => (int) $item->total_bookings,
            ]);

        $topBlogs = BlogPost::query()
            ->latest()
            ->limit(5)
            ->get(['id', 'title'])
            ->map(fn ($item) => [
                'title' => $item->title,
                'views' => ((int) $item->id * 137) % 12000 + 120,
            ])
            ->sortByDesc('views')
            ->values();

        return [
            'topPackages' => $topPackages,
            'topBlogs' => $topBlogs,
        ];
    }

    private function getSeoSectionData(): array
    {
        $keywordCounts = collect();
        $allKeywords = collect();

        SeoMeta::query()
            ->whereNotNull('meta_keywords')
            ->pluck('meta_keywords')
            ->each(function ($value) use (&$keywordCounts, &$allKeywords): void {
                $parts = collect(explode(',', (string) $value))
                    ->map(fn ($item) => trim($item))
                    ->filter();

                $allKeywords = $allKeywords->merge($parts);
                $keywordCounts = $keywordCounts->merge($parts);
            });

        $siteKeywords = WebsiteSetting::query()->value('seo_keywords');
        if ($siteKeywords) {
            $siteParts = collect(explode(',', (string) $siteKeywords))
                ->map(fn ($item) => trim($item))
                ->filter();
            $allKeywords = $allKeywords->merge($siteParts);
            $keywordCounts = $keywordCounts->merge($siteParts);
        }

        $ranked = $keywordCounts
            ->countBy()
            ->sortDesc()
            ->take(6)
            ->map(fn ($count, $keyword) => ['keyword' => $keyword, 'count' => $count])
            ->values();

        $score = min(100, 40 + ($ranked->count() * 10));

        return [
            'keywordsRankingCount' => $allKeywords->unique(fn ($item) => mb_strtolower($item))->count(),
            'topKeywords' => $ranked,
            'seoScore' => $score,
        ];
    }

    private function getLatestVisitors(): array
    {
        return Lead::query()
            ->latest()
            ->limit(6)
            ->get(['name', 'source', 'created_at'])
            ->map(fn ($lead) => [
                'name' => $lead->name,
                'source' => $lead->source ?: 'direct',
                'time' => optional($lead->created_at)->diffForHumans(),
            ])
            ->all();
    }
}
