<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class WebsiteSettingController extends Controller
{
    public function index(): Response
    {
        $settings = WebsiteSetting::query()->firstOrCreate(['id' => 1], ['site_name' => config('app.name')]);

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $settings = WebsiteSetting::query()->firstOrCreate(['id' => 1], ['site_name' => config('app.name')]);

        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'sales_email' => ['nullable', 'email', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'primary_phone' => ['nullable', 'string', 'max:30'],
            'secondary_phone' => ['nullable', 'string', 'max:30'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'whatsapp_number' => ['nullable', 'string', 'max:30'],
            'whatsapp_default_message' => ['nullable', 'string'],
            'whatsapp_floating_enabled' => ['nullable', 'boolean'],
            'whatsapp_button_position' => ['nullable', 'in:left,right'],
            'whatsapp_button_style' => ['nullable', 'in:rounded,square'],
            'whatsapp_auto_reply_message' => ['nullable', 'string'],
            'whatsapp_business_hours_auto_response' => ['nullable', 'boolean'],
            'whatsapp_agent_numbers' => ['nullable', 'array'],
            'whatsapp_agent_numbers.*.name' => ['nullable', 'string', 'max:120'],
            'whatsapp_agent_numbers.*.number' => ['nullable', 'string', 'max:30'],
            'call_tracking_enabled' => ['nullable', 'boolean'],
            'office_locations' => ['nullable', 'array'],
            'office_locations.*.address' => ['nullable', 'string', 'max:500'],
            'office_locations.*.city' => ['nullable', 'string', 'max:120'],
            'office_locations.*.map_link' => ['nullable', 'url', 'max:1000'],
            'working_hours' => ['nullable', 'array'],
            'working_hours.*.day' => ['nullable', 'string', 'max:20'],
            'working_hours.*.is_open' => ['nullable', 'boolean'],
            'working_hours.*.open' => ['nullable', 'string', 'max:20'],
            'working_hours.*.close' => ['nullable', 'string', 'max:20'],
            'footer_content' => ['nullable', 'string'],
            'copyright_text' => ['nullable', 'string', 'max:255'],
            'facebook_url' => ['nullable', 'url', 'max:255'],
            'instagram_url' => ['nullable', 'url', 'max:255'],
            'youtube_url' => ['nullable', 'url', 'max:255'],
            'seo_meta_title' => ['nullable', 'string', 'max:255'],
            'seo_title_template' => ['nullable', 'string', 'max:255'],
            'seo_meta_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string'],
            'seo_robots_index' => ['nullable', 'boolean'],
            'seo_canonical_base' => ['nullable', 'url', 'max:255'],
            'seo_og_title' => ['nullable', 'string', 'max:255'],
            'seo_og_description' => ['nullable', 'string'],
            'seo_auto_slug_rules' => ['nullable', 'string', 'max:120'],
            'seo_schema_enabled' => ['nullable', 'boolean'],
            'google_analytics_code' => ['nullable', 'string'],
            'ga4_property_id' => ['nullable', 'string', 'max:80'],
            'ga4_service_account_email' => ['nullable', 'email', 'max:255'],
            'ga4_json_key_file' => ['nullable', 'file', 'mimetypes:application/json,text/plain', 'max:4096'],
            'smtp_settings' => ['nullable', 'array'],
            'smtp_settings.driver' => ['nullable', 'in:smtp,mailgun,gmail'],
            'smtp_settings.host' => ['nullable', 'string', 'max:255'],
            'smtp_settings.port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'smtp_settings.username' => ['nullable', 'string', 'max:255'],
            'smtp_settings.password' => ['nullable', 'string', 'max:255'],
            'smtp_settings.encryption' => ['nullable', 'in:ssl,tls'],
            'logo_file' => ['nullable', 'image', 'max:2048'],
            'favicon_file' => ['nullable', 'image', 'max:1024'],
            'seo_og_image_file' => ['nullable', 'image', 'max:2048'],
        ]);

        unset($data['logo_file'], $data['favicon_file'], $data['seo_og_image_file'], $data['ga4_json_key_file']);

        if ($request->hasFile('logo_file')) {
            $data['logo'] = $request->file('logo_file')->store('settings', 'public');
        }

        if ($request->hasFile('favicon_file')) {
            $data['favicon'] = $request->file('favicon_file')->store('settings', 'public');
        }

        if ($request->hasFile('seo_og_image_file')) {
            $data['seo_og_image'] = $request->file('seo_og_image_file')->store('settings', 'public');
        }

        if ($request->hasFile('ga4_json_key_file')) {
            $data['ga4_json_key_path'] = $request->file('ga4_json_key_file')->store('settings', 'public');
        }

        $settings->update($data);

        return back()->with('success', 'Settings updated.');
    }

    public function testEmail(Request $request): RedirectResponse
    {
        $payload = $request->validate([
            'test_email' => ['required', 'email'],
            'smtp_settings' => ['required', 'array'],
            'smtp_settings.driver' => ['required', 'in:smtp,mailgun,gmail'],
            'smtp_settings.host' => ['required', 'string', 'max:255'],
            'smtp_settings.port' => ['required', 'integer', 'min:1', 'max:65535'],
            'smtp_settings.username' => ['required', 'string', 'max:255'],
            'smtp_settings.password' => ['required', 'string', 'max:255'],
            'smtp_settings.encryption' => ['required', 'in:ssl,tls'],
        ]);

        try {
            $settings = $payload['smtp_settings'];
            Config::set('mail.mailers.smtp_test', [
                'transport' => 'smtp',
                'host' => $settings['host'],
                'port' => (int) $settings['port'],
                'encryption' => $settings['encryption'],
                'username' => $settings['username'],
                'password' => $settings['password'],
                'timeout' => null,
            ]);

            Mail::mailer('smtp_test')->raw(
                'SMTP test successful. Your email configuration is connected.',
                function ($message) use ($payload): void {
                    $message->to($payload['test_email'])->subject('SMTP Test Email');
                }
            );

            return back()->with('smtp_test_status', 'connected')->with('smtp_test_message', 'SMTP connected. Test email sent successfully.');
        } catch (\Throwable $e) {
            return back()->with('smtp_test_status', 'failed')->with('smtp_test_message', 'SMTP failed: '.$e->getMessage());
        }
    }

    public function testGa4Connection(Request $request): RedirectResponse
    {
        $settings = WebsiteSetting::query()->firstOrCreate(['id' => 1], ['site_name' => config('app.name')]);

        $payload = $request->validate([
            'ga4_property_id' => ['required', 'string', 'max:80'],
            'ga4_service_account_email' => ['required', 'email', 'max:255'],
            'ga4_json_key_file' => ['nullable', 'file', 'mimetypes:application/json,text/plain', 'max:4096'],
        ]);

        $keyPath = $settings->ga4_json_key_path;
        if ($request->hasFile('ga4_json_key_file')) {
            $keyPath = $request->file('ga4_json_key_file')->store('settings', 'public');
        }

        if (! $keyPath || ! Storage::disk('public')->exists($keyPath)) {
            return back()->with('ga4_test_status', 'failed')->with('ga4_test_message', 'Upload a valid GA4 service account JSON key first.');
        }

        try {
            $keyJson = Storage::disk('public')->get($keyPath);
            $keyData = json_decode($keyJson, true, 512, JSON_THROW_ON_ERROR);
            $accessToken = $this->createGoogleAccessToken($keyData);
            $snapshot = $this->fetchGa4Snapshot($payload['ga4_property_id'], $accessToken);

            $settings->update([
                'ga4_property_id' => $payload['ga4_property_id'],
                'ga4_service_account_email' => $payload['ga4_service_account_email'],
                'ga4_json_key_path' => $keyPath,
                'ga4_last_snapshot' => $snapshot,
            ]);

            return back()->with('ga4_test_status', 'connected')->with('ga4_test_message', 'GA4 connected successfully.');
        } catch (\Throwable $e) {
            return back()->with('ga4_test_status', 'failed')->with('ga4_test_message', 'GA4 connection failed: '.$e->getMessage());
        }
    }

    private function createGoogleAccessToken(array $serviceAccount): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claimSet = $this->base64UrlEncode(json_encode([
            'iss' => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now,
        ]));

        $unsignedToken = $header.'.'.$claimSet;
        $signature = '';
        $privateKey = openssl_pkey_get_private($serviceAccount['private_key']);
        if (! $privateKey || ! openssl_sign($unsignedToken, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new \RuntimeException('Unable to sign JWT with service account private key.');
        }

        $jwt = $unsignedToken.'.'.$this->base64UrlEncode($signature);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Token request failed: '.$response->body());
        }

        return (string) $response->json('access_token');
    }

    private function fetchGa4Snapshot(string $propertyId, string $accessToken): array
    {
        $response = Http::withToken($accessToken)->post("https://analyticsdata.googleapis.com/v1beta/properties/{$propertyId}:runReport", [
            'dateRanges' => [['startDate' => '7daysAgo', 'endDate' => 'today']],
            'metrics' => [['name' => 'activeUsers'], ['name' => 'screenPageViews']],
            'dimensions' => [['name' => 'pagePath']],
            'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
            'limit' => 5,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('GA4 report request failed: '.$response->body());
        }

        $rows = $response->json('rows', []);
        $visitors = 0;
        $pageViews = 0;
        $topPages = [];
        foreach ($rows as $row) {
            $path = $row['dimensionValues'][0]['value'] ?? '/';
            $activeUsers = (int) ($row['metricValues'][0]['value'] ?? 0);
            $views = (int) ($row['metricValues'][1]['value'] ?? 0);
            $visitors += $activeUsers;
            $pageViews += $views;
            $topPages[] = ['path' => $path, 'views' => $views];
        }

        return [
            'visitors' => $visitors,
            'page_views' => $pageViews,
            'top_pages' => $topPages,
            'fetched_at' => now()->toDateTimeString(),
        ];
    }

    private function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }
}
