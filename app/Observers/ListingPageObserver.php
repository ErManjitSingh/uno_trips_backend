<?php

namespace App\Observers;

use App\Models\ListingPage;
use App\Services\ListingPageQueryService;

class ListingPageObserver
{
    public function saved(ListingPage $listingPage): void
    {
        app(ListingPageQueryService::class)->clearCache($listingPage);
    }

    public function deleted(ListingPage $listingPage): void
    {
        app(ListingPageQueryService::class)->clearCache($listingPage);
    }
}
