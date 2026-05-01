<?php

namespace App\Providers;

use App\Models\ListingPage;
use App\Observers\ListingPageObserver;
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
        ListingPage::observe(ListingPageObserver::class);
    }
}
