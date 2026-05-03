<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use App\Services\SeoResolver;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    public function settings(): JsonResponse
    {
        $row = WebsiteSetting::query()->first();

        $public = $row ? $row->only([
            'site_name',
            'company_name',
            'tagline',
            'logo',
            'favicon',
            'support_email',
            'sales_email',
            'contact_email',
            'primary_phone',
            'secondary_phone',
            'contact_phone',
            'whatsapp_number',
            'whatsapp_default_message',
            'whatsapp_floating_enabled',
            'whatsapp_button_position',
            'whatsapp_button_style',
            'office_locations',
            'working_hours',
            'footer_content',
            'copyright_text',
            'facebook_url',
            'instagram_url',
            'youtube_url',
        ]) : null;

        return response()->json(['settings' => $public]);
    }

    public function about(SeoResolver $seoResolver): JsonResponse
    {
        return response()->json([
            'seo' => $seoResolver->forPage('about', [
                'title' => 'About UNO Trips Luxury',
                'description' => 'Trusted luxury UNO Trips travel planners.',
                'canonical_url' => route('about'),
            ]),
        ]);
    }

    public function contact(SeoResolver $seoResolver): JsonResponse
    {
        $row = WebsiteSetting::query()->first();
        $public = $row ? $row->only([
            'site_name',
            'company_name',
            'tagline',
            'logo',
            'support_email',
            'sales_email',
            'contact_email',
            'primary_phone',
            'secondary_phone',
            'contact_phone',
            'whatsapp_number',
            'whatsapp_default_message',
            'office_locations',
            'working_hours',
        ]) : null;

        return response()->json([
            'seo' => $seoResolver->forPage('contact', [
                'title' => 'Contact Us',
                'description' => 'Talk to our travel specialists.',
                'canonical_url' => route('contact.index'),
            ]),
            'settings' => $public,
        ]);
    }
}
