<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SeasonalOfferController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/SeasonalOffers/Index', [
            'offers' => [
                [
                    'id' => 1,
                    'title' => 'Summer Escape 2026',
                    'slug' => 'summer-escape-2026',
                    'banner' => 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
                    'discount_tag' => '25% OFF',
                    'discount_type' => 'Percentage',
                    'discount_value' => 25,
                    'start_date' => '2026-05-01',
                    'end_date' => '2026-06-30',
                    'linked_packages' => ['Goa Beach Party Trail', 'Kerala Backwater Retreat'],
                    'status' => 'Active',
                    'description' => 'Limited-time summer campaign with beachfront experiences.',
                    'cta_text' => 'Book Summer Deal',
                    'homepage_banner' => true,
                    'priority' => 1,
                ],
                [
                    'id' => 2,
                    'title' => 'Monsoon Magic Fest',
                    'slug' => 'monsoon-magic-fest',
                    'banner' => 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80',
                    'discount_tag' => '₹5000 OFF',
                    'discount_type' => 'Flat',
                    'discount_value' => 5000,
                    'start_date' => '2026-07-10',
                    'end_date' => '2026-08-31',
                    'linked_packages' => ['Kashmir Valley Deluxe', 'Shimla Heritage Drive'],
                    'status' => 'Draft',
                    'description' => 'Festive monsoon creatives with cabin and hill-stay combos.',
                    'cta_text' => 'Grab Monsoon Offer',
                    'homepage_banner' => false,
                    'priority' => 3,
                ],
            ],
            'packageOptions' => [
                'Goa Beach Party Trail',
                'Kerala Backwater Retreat',
                'Kashmir Valley Deluxe',
                'Shimla Heritage Drive',
                'Ladakh Adventure Roadtrip',
                'Manali Snow Escape',
            ],
        ]);
    }
}
