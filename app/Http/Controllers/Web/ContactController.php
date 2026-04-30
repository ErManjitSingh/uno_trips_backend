<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use App\Services\SeoResolver;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(SeoResolver $seoResolver): Response
    {
        return Inertia::render('Web/Contact', [
            'settings' => WebsiteSetting::query()->first(),
            'seo' => $seoResolver->forPage('contact', [
                'title' => 'Contact Us',
                'description' => 'Talk to our travel specialists.',
                'canonical_url' => route('contact.index'),
            ]),
        ]);
    }

    public function thankYou(): Response
    {
        return Inertia::render('Web/ThankYou');
    }
}
