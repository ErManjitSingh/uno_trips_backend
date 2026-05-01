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
use App\Http\Controllers\Api\V1\ListingPageController as V1ListingPageController;
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
    Route::get('reviews', [ReviewController::class, 'index']);
    Route::get('reviews/{review}', [ReviewController::class, 'show']);
    Route::put('reviews/{review}/approve', [ReviewController::class, 'approve']);
    Route::put('reviews/{review}/reject', [ReviewController::class, 'reject']);
    Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);
    Route::post('reviews/{review}/reply', [ReviewController::class, 'reply']);
});

Route::prefix('v1')->group(function (): void {
    Route::get('listing-pages', [V1ListingPageController::class, 'index']);
    Route::post('listing-pages', [V1ListingPageController::class, 'store']);
    Route::get('listing-pages/{slug}', [V1ListingPageController::class, 'show']);
});
