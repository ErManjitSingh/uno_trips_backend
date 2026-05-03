<?php

use App\Http\Controllers\Api\Admin\ActivityLogController;
use App\Http\Controllers\Api\Admin\BlogController;
use App\Http\Controllers\Api\Admin\BookingController;
use App\Http\Controllers\Api\Admin\GlobalSeoSettingController;
use App\Http\Controllers\Api\Admin\LeadController;
use App\Http\Controllers\Api\Admin\PackageImageController;
use App\Http\Controllers\Api\Admin\PageController;
use App\Http\Controllers\Api\Admin\ReviewController;
use App\Http\Controllers\Api\Admin\SeoMetaController;
use App\Http\Controllers\Api\Admin\TourPackageController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\V1\BlogController as V1BlogController;
use App\Http\Controllers\Api\V1\DestinationController as V1DestinationController;
use App\Http\Controllers\Api\V1\HomeController as V1HomeController;
use App\Http\Controllers\Api\V1\LeadController as V1LeadController;
use App\Http\Controllers\Api\V1\ListingPageController as V1ListingPageController;
use App\Http\Controllers\Api\V1\PackageController as V1PackageController;
use App\Http\Controllers\Api\V1\SiteController as V1SiteController;
use App\Http\Controllers\Api\V1\TourController as V1TourController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function (Request $request): array {
    return [
        'ok' => true,
        'user' => $request->user()?->only(['id', 'name', 'email']),
    ];
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function (): void {
    Route::apiResource('users', UserController::class);
    Route::apiResource('tour-packages', TourPackageController::class);
    Route::apiResource('package-images', PackageImageController::class);
    Route::apiResource('bookings', BookingController::class);
    Route::apiResource('leads', LeadController::class);
    Route::apiResource('blogs', BlogController::class);
    Route::apiResource('seo-meta', SeoMetaController::class);
    Route::apiResource('global-seo-settings', GlobalSeoSettingController::class);
    Route::apiResource('activity-logs', ActivityLogController::class);
    Route::apiResource('reviews', ReviewController::class);
    Route::put('reviews/{review}/approve', [ReviewController::class, 'approve']);
    Route::put('reviews/{review}/reject', [ReviewController::class, 'reject']);
    Route::post('reviews/{review}/reply', [ReviewController::class, 'reply']);
    Route::apiResource('pages', PageController::class);
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function (): void {
    Route::post('auth/logout', [AuthenticatedSessionController::class, 'apiLogout']);
    Route::post('listing-pages', [V1ListingPageController::class, 'store']);
    Route::get('reviews', [ReviewController::class, 'index']);
    Route::get('reviews/{review}', [ReviewController::class, 'show']);
    Route::put('reviews/{review}/approve', [ReviewController::class, 'approve']);
    Route::put('reviews/{review}/reject', [ReviewController::class, 'reject']);
    Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);
    Route::post('reviews/{review}/reply', [ReviewController::class, 'reply']);
});

Route::prefix('v1')->group(function (): void {
    Route::get('home', V1HomeController::class);
    Route::get('site/settings', [V1SiteController::class, 'settings']);
    Route::get('site/about', [V1SiteController::class, 'about']);
    Route::get('site/contact', [V1SiteController::class, 'contact']);
    Route::get('packages', [V1PackageController::class, 'index']);
    Route::get('packages/bundle', [V1PackageController::class, 'allPackagesBundle']);
    Route::get('packages/{slug}', [V1PackageController::class, 'show']);
    Route::get('package/{slug}', [V1PackageController::class, 'show']);
    Route::get('tours', [V1TourController::class, 'index']);
    Route::get('tours/{slug}', [V1TourController::class, 'show']);
    Route::get('destinations', [V1DestinationController::class, 'index']);
    Route::get('destinations/{slug}', [V1DestinationController::class, 'show']);
    Route::get('blog/categories', [V1BlogController::class, 'categories']);
    Route::get('blog/posts', [V1BlogController::class, 'index']);
    Route::get('blog/posts/{slug}', [V1BlogController::class, 'show']);
    Route::post('leads', [V1LeadController::class, 'store']);
    Route::get('listing-pages', [V1ListingPageController::class, 'index']);
    Route::get('listing-pages/{slug}', [V1ListingPageController::class, 'show']);
});
