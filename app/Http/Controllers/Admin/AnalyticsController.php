<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\TourPackage;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $kpis = Cache::remember('admin.analytics.kpis', now()->addMinutes(2), function (): array {
            $now = now();
            $monthlyVisitors = Lead::query()
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->count() * 28;

            $qualifiedLeads = Lead::query()->whereIn('status', ['contacted', 'won'])->count();
            $totalLeads = max(Lead::query()->count(), 1);
            $totalBookings = Booking::query()->count();
            $conversionRate = round(($totalBookings / $totalLeads) * 100, 2);

            $currentMonthBookings = Booking::query()
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->count();

            $previousMonthBookings = Booking::query()
                ->whereMonth('created_at', $now->copy()->subMonth()->month)
                ->whereYear('created_at', $now->copy()->subMonth()->year)
                ->count();

            $bookingGrowth = round((($currentMonthBookings + 1) / ($previousMonthBookings + 1) - 1) * 100, 1);

            return [
                'monthlyVisitors' => $monthlyVisitors,
                'conversionRate' => $conversionRate,
                'qualifiedLeads' => $qualifiedLeads,
                'bookingGrowth' => $bookingGrowth,
                'activePackages' => TourPackage::query()->where('status', 'published')->count(),
            ];
        });

        return Inertia::render('Admin/Analytics/Index', [
            'kpis' => $kpis,
        ]);
    }
}
