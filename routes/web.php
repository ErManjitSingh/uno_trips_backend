<?php

use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\BlogCategoryController;
use App\Http\Controllers\Admin\BlogTagController;
use App\Http\Controllers\Admin\CommentModerationController;
use App\Http\Controllers\Admin\ContentApprovalController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\ListingPageCategoryController;
use App\Http\Controllers\Admin\ListingPageController as AdminListingPageController;
use App\Http\Controllers\Admin\TourPackageController;
use App\Http\Controllers\Admin\FeaturedPackageController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\AdminAssistantApiController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\ReviewManagementController;
use App\Http\Controllers\Admin\SeasonalOfferController;
use App\Http\Controllers\Admin\SeoManagementApiController;
use App\Http\Controllers\Admin\SeoManagementController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\WebsiteSettingController;
use App\Http\Controllers\Admin\WebsiteControlController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\Web\BlogController;
use App\Http\Controllers\Web\ContactController;
use App\Http\Controllers\Web\HomeEntryController;
use App\Http\Controllers\Web\HomeController;
use App\Http\Controllers\Web\LeadController as WebLeadController;
use App\Http\Controllers\Web\ListingPageController as WebListingPageController;
use App\Http\Controllers\Web\TourController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeEntryController::class)->name('home');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/tours', [TourController::class, 'index'])->name('tours.index');
Route::get('/tours/{tourPackage:slug}', [TourController::class, 'show'])->name('tours.show');
Route::get('/destinations/{destination:slug}', [TourController::class, 'destination'])->name('destinations.show');
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{blogPost:slug}', [BlogController::class, 'show'])->name('blog.show');
Route::get('/contact', [ContactController::class, 'index'])->name('contact.index');
Route::get('/packages/{listingPage:slug}', [WebListingPageController::class, 'show'])->name('packages.show');
Route::post('/inquiry', [WebLeadController::class, 'store'])->name('inquiry.store');
Route::get('/thank-you', [ContactController::class, 'thankYou'])->name('thank-you');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', [SitemapController::class, 'robots'])->name('robots');

Route::middleware('guest')->group(function (): void {
    Route::redirect('/admin/login', '/login');
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.update');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/search-locations', [LocationController::class, 'search'])->name('locations.search');
    Route::post('/search-locations/recent', [LocationController::class, 'rememberRecent'])->name('locations.recent');

    Route::middleware(['role:super_admin,executive,staff,sales,content_manager', 'admin.session.timeout', 'deny_executive'])->group(function (): void {
        Route::get('/api/admin-status', [AdminAssistantApiController::class, 'adminStatus']);
        Route::get('/api/system-audit', [AdminAssistantApiController::class, 'systemAudit']);
        Route::get('/api/readiness-score', [AdminAssistantApiController::class, 'readinessScore']);
        Route::post('/api/assistant-chat', [AdminAssistantApiController::class, 'assistantChat']);
    });

    Route::prefix('admin')->name('admin.')->middleware(['role:super_admin,executive,staff,sales,content_manager', 'admin.session.timeout'])->group(function (): void {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        /*
         * Content approvals: same admin role gate as the rest of the panel; super-admin only inside the controller.
         * Keeping these routes outside the nested super_admin middleware avoids rare route-cache / ordering issues
         * that can surface as 404 on some hosts.
         */
        Route::get('/approvals', [ContentApprovalController::class, 'index'])->name('approvals.index');
        Route::post('/approvals/packages/{tourPackage}/approve', [ContentApprovalController::class, 'approvePackage'])->name('approvals.packages.approve');
        Route::post('/approvals/packages/{tourPackage}/reject', [ContentApprovalController::class, 'rejectPackage'])->name('approvals.packages.reject');
        Route::post('/approvals/blogs/{blog}/approve', [ContentApprovalController::class, 'approveBlog'])->name('approvals.blogs.approve');
        Route::post('/approvals/blogs/{blog}/reject', [ContentApprovalController::class, 'rejectBlog'])->name('approvals.blogs.reject');
        Route::post('/approvals/packages/bulk-approve', [ContentApprovalController::class, 'bulkApprovePackages'])->name('approvals.packages.bulk-approve');
        Route::post('/approvals/blogs/bulk-approve', [ContentApprovalController::class, 'bulkApproveBlogs'])->name('approvals.blogs.bulk-approve');

        Route::middleware('super_admin')->group(function (): void {
            Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
            Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
            Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
            Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
        });

        Route::resource('packages', TourPackageController::class)->except(['create', 'edit', 'show']);
        Route::post('/packages/bulk-discount', [TourPackageController::class, 'bulkDiscount'])->name('packages.bulk-discount');
        Route::post('/packages/bulk-delete', [TourPackageController::class, 'bulkDelete'])->name('packages.bulk-delete');
        Route::post('/packages/{package}/duplicate-log', [TourPackageController::class, 'duplicateLog'])->name('packages.duplicate-log');
        Route::post('/packages/itinerary-day-image', [TourPackageController::class, 'uploadItineraryDayImage'])->name('packages.itinerary-day-image');
        Route::post('/packages/editor-image', [TourPackageController::class, 'uploadEditorImage'])->name('packages.editor-image');

        Route::get('/blogs/create', [BlogPostController::class, 'create'])->name('blogs.create');
        Route::get('/blogs/{blog}/edit', [BlogPostController::class, 'edit'])->name('blogs.edit');
        Route::get('/blogs/drafts', [BlogPostController::class, 'drafts'])->name('blogs.drafts');
        Route::resource('blogs', BlogPostController::class)->except(['create', 'edit', 'show']);
        Route::post('/blogs/editor-image', [BlogPostController::class, 'uploadEditorImage'])->name('blogs.editor-image');
        Route::post('/blogs/autosave', [BlogPostController::class, 'autosave'])->name('blogs.autosave');

        Route::get('/blog-categories', [BlogCategoryController::class, 'index'])->name('blog-categories.index');
        Route::post('/blog-categories', [BlogCategoryController::class, 'store'])->name('blog-categories.store');
        Route::put('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'update'])->name('blog-categories.update');
        Route::delete('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'destroy'])->name('blog-categories.destroy');
        Route::get('/blog-tags', [BlogTagController::class, 'index'])->name('blog-tags.index');
        Route::post('/blog-tags', [BlogTagController::class, 'store'])->name('blog-tags.store');

        Route::get('/media-library', [MediaLibraryController::class, 'index'])->name('media.index');
        Route::post('/media-library', [MediaLibraryController::class, 'store'])->name('media.store');
        Route::delete('/media-library/{media}', [MediaLibraryController::class, 'destroy'])->name('media.destroy');

        Route::middleware('deny_executive')->group(function (): void {
            Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');
            Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
            Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
            Route::get('/featured-packages', [FeaturedPackageController::class, 'index'])->name('featured-packages.index');
            Route::put('/featured-packages/reorder', [FeaturedPackageController::class, 'reorder'])->name('featured-packages.reorder');
            Route::put('/featured-packages/settings', [FeaturedPackageController::class, 'updateSettings'])->name('featured-packages.settings');
            Route::put('/featured-packages/{package}/feature', [FeaturedPackageController::class, 'updateFeature'])->name('featured-packages.feature');
            Route::get('/reviews', [ReviewManagementController::class, 'index'])->name('reviews.index');
            Route::get('/reviews/{review}', [ReviewManagementController::class, 'show'])->name('reviews.show');
            Route::put('/reviews/{review}/approve', [ReviewManagementController::class, 'approve'])->name('reviews.approve');
            Route::put('/reviews/{review}/reject', [ReviewManagementController::class, 'reject'])->name('reviews.reject');
            Route::put('/reviews/{review}/spam', [ReviewManagementController::class, 'spam'])->name('reviews.spam');
            Route::put('/reviews/{review}/flags', [ReviewManagementController::class, 'toggleFlags'])->name('reviews.flags');
            Route::post('/reviews/{review}/reply', [ReviewManagementController::class, 'reply'])->name('reviews.reply');
            Route::delete('/reviews/{review}/reply', [ReviewManagementController::class, 'deleteReply'])->name('reviews.reply.delete');
            Route::post('/reviews/bulk-action', [ReviewManagementController::class, 'bulk'])->name('reviews.bulk');
            Route::delete('/reviews/{review}', [ReviewManagementController::class, 'destroy'])->name('reviews.destroy');
            Route::get('/seasonal-offers', [SeasonalOfferController::class, 'index'])->name('seasonal-offers.index');
            Route::get('/listing-pages', [AdminListingPageController::class, 'index'])->name('listing-pages.index');
            Route::get('/listing-pages/create', [AdminListingPageController::class, 'create'])->name('listing-pages.create');
            Route::get('/listing-pages/{listingPage:slug}/edit', [AdminListingPageController::class, 'edit'])->name('listing-pages.edit');
            Route::post('/listing-pages', [AdminListingPageController::class, 'store'])->name('listing-pages.store');
            Route::post('/listing-pages/seed-demo', [AdminListingPageController::class, 'seedDemo'])->name('listing-pages.seed-demo');
            Route::put('/listing-pages/reorder', [AdminListingPageController::class, 'reorder'])->name('listing-pages.reorder');
            Route::put('/listing-pages/bulk-status', [AdminListingPageController::class, 'bulkStatus'])->name('listing-pages.bulk-status');
            Route::delete('/listing-pages/bulk-delete', [AdminListingPageController::class, 'bulkDelete'])->name('listing-pages.bulk-delete');
            Route::put('/listing-pages/{listingPage:slug}', [AdminListingPageController::class, 'update'])->name('listing-pages.update');
            Route::delete('/listing-pages/{listingPage:slug}', [AdminListingPageController::class, 'destroy'])->name('listing-pages.destroy');
            Route::put('/listing-pages/{listingPage:slug}/toggle-status', [AdminListingPageController::class, 'toggleStatus'])->name('listing-pages.toggle-status');
            Route::post('/listing-pages/{listingPage:slug}/duplicate', [AdminListingPageController::class, 'duplicate'])->name('listing-pages.duplicate');
            Route::get('/listing-categories', [ListingPageCategoryController::class, 'index'])->name('listing-categories.index');
            Route::post('/listing-categories', [ListingPageCategoryController::class, 'store'])->name('listing-categories.store');
            Route::put('/listing-categories/{listingCategory}', [ListingPageCategoryController::class, 'update'])->name('listing-categories.update');
            Route::put('/listing-categories/{listingCategory}/toggle-status', [ListingPageCategoryController::class, 'toggleStatus'])->name('listing-categories.toggle-status');
            Route::delete('/listing-categories/{listingCategory}', [ListingPageCategoryController::class, 'destroy'])->name('listing-categories.destroy');
            Route::resource('bookings', BookingController::class)->only(['index', 'store', 'update']);
            Route::resource('leads', LeadController::class)->only(['index', 'store', 'update']);
            Route::get('/leads-export', [LeadController::class, 'export'])->name('leads.export');
            Route::get('/blogs/seo-manager', [BlogPostController::class, 'seoManager'])->name('blogs.seo-manager');
            Route::post('/blogs/bulk-action', [BlogPostController::class, 'bulkAction'])->name('blogs.bulk-action');
            Route::put('/blogs/{blog}/quick-publish', [BlogPostController::class, 'quickPublish'])->name('blogs.quick-publish');
            Route::put('/blogs/{blog}/seo', [BlogPostController::class, 'updateSeo'])->name('blogs.seo.update');
            Route::post('/blogs/seo/bulk-update', [BlogPostController::class, 'bulkSeoUpdate'])->name('blogs.seo.bulk-update');
            Route::get('/blog-comments', [CommentModerationController::class, 'index'])->name('blog-comments.index');
            Route::put('/blog-comments/{comment}/approve', [CommentModerationController::class, 'approve'])->name('blog-comments.approve');
            Route::delete('/blog-comments/{comment}/reject', [CommentModerationController::class, 'reject'])->name('blog-comments.reject');
            Route::post('/blog-comments/bulk', [CommentModerationController::class, 'bulkModerate'])->name('blog-comments.bulk');
            Route::resource('customers', CustomerController::class)->only(['index', 'store', 'update']);
            Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
            Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
            Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
            Route::get('/settings', [WebsiteSettingController::class, 'index'])->name('settings.index');
            Route::put('/settings', [WebsiteSettingController::class, 'update'])->name('settings.update');
            Route::post('/settings/test-email', [WebsiteSettingController::class, 'testEmail'])->name('settings.test-email');
            Route::post('/settings/test-ga4', [WebsiteSettingController::class, 'testGa4Connection'])->name('settings.test-ga4');
            Route::get('/seo-management', [SeoManagementController::class, 'index'])->name('seo-management.index');
            Route::prefix('/seo-management/api')->name('seo-management.api.')->group(function (): void {
                Route::get('/entries', [SeoManagementApiController::class, 'index'])->name('entries.index');
                Route::post('/entries', [SeoManagementApiController::class, 'store'])->name('entries.store');
                Route::get('/entries/{seoMeta}', [SeoManagementApiController::class, 'show'])->name('entries.show');
                Route::put('/entries/{seoMeta}', [SeoManagementApiController::class, 'update'])->name('entries.update');
                Route::delete('/entries/{seoMeta}', [SeoManagementApiController::class, 'destroy'])->name('entries.destroy');
                Route::post('/entries/bulk-update', [SeoManagementApiController::class, 'bulkUpdate'])->name('entries.bulk-update');
                Route::post('/entries/auto-generate', [SeoManagementApiController::class, 'autoGenerate'])->name('entries.auto-generate');
                Route::post('/schema-template', [SeoManagementApiController::class, 'schemaTemplate'])->name('schema-template');
                Route::put('/technical', [SeoManagementApiController::class, 'updateTechnical'])->name('technical.update');
            });
            Route::get('/website-control/{section}', [WebsiteControlController::class, 'show'])->name('website-control.show');
            Route::put('/website-control/{section}', [WebsiteControlController::class, 'update'])->name('website-control.update');
        });
    });
});
