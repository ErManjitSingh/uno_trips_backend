<?php

namespace App\Providers;

use App\Models\BlogPost;
use App\Models\ListingPage;
use App\Models\TourPackage;
use App\Observers\ListingPageObserver;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        Route::bind('tourPackage', function (string $value): TourPackage {
            $query = TourPackage::query()->where('slug', $value)->publiclyVisible();

            return $query->firstOrFail();
        });

        Route::bind('blogPost', function (string $value): BlogPost {
            $query = BlogPost::query()->where('slug', $value)->publiclyVisible();

            return $query->firstOrFail();
        });

        ListingPage::observe(ListingPageObserver::class);
    }
}
