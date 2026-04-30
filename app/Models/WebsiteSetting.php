<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    protected $fillable = [
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
        'whatsapp_auto_reply_message',
        'whatsapp_business_hours_auto_response',
        'whatsapp_agent_numbers',
        'call_tracking_enabled',
        'office_locations',
        'working_hours',
        'footer_content',
        'copyright_text',
        'facebook_url',
        'instagram_url',
        'youtube_url',
        'smtp_settings',
        'seo_meta_title',
        'seo_title_template',
        'seo_meta_description',
        'seo_keywords',
        'seo_robots_index',
        'seo_canonical_base',
        'seo_og_title',
        'seo_og_description',
        'seo_auto_slug_rules',
        'seo_schema_enabled',
        'seo_og_image',
        'google_analytics_code',
        'ga4_property_id',
        'ga4_service_account_email',
        'ga4_json_key_path',
        'ga4_last_snapshot',
        'meta_pixel_code',
    ];

    protected function casts(): array
    {
        return [
            'smtp_settings' => 'array',
            'office_locations' => 'array',
            'working_hours' => 'array',
            'call_tracking_enabled' => 'boolean',
            'whatsapp_floating_enabled' => 'boolean',
            'whatsapp_business_hours_auto_response' => 'boolean',
            'whatsapp_agent_numbers' => 'array',
            'ga4_last_snapshot' => 'array',
            'seo_robots_index' => 'boolean',
            'seo_schema_enabled' => 'boolean',
        ];
    }
}
