<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class LocationController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
        ]);

        $query = trim((string) ($validated['q'] ?? ''));
        $recent = $this->recentLocations($request);
        $popular = $this->popularLocations();

        if ($query === '') {
            return response()->json([
                'data' => collect([...$recent, ...$popular])->unique('label')->take(10)->values(),
            ]);
        }

        $username = config('services.geonames.username', env('GEONAMES_USERNAME', 'demo'));
        $cacheKey = 'location-search:v2:'.md5($query);

        $data = Cache::remember($cacheKey, 1800, function () use ($query, $username) {
            $fromGeoNames = [];
            try {
                $response = Http::timeout(8)->get('http://api.geonames.org/searchJSON', [
                    'q' => $query,
                    'maxRows' => 10,
                    'featureClass' => 'P',
                    'orderby' => 'relevance',
                    'username' => $username,
                ]);

                if ($response->ok()) {
                    $rows = $response->json('geonames', []);
                    $fromGeoNames = $this->mapGeoNamesRows($rows);
                }
            } catch (\Throwable $e) {
                $fromGeoNames = [];
            }

            if (! empty($fromGeoNames)) {
                return $fromGeoNames;
            }

            try {
                $nominatim = Http::timeout(8)
                    ->withHeaders(['User-Agent' => 'LaravelTourPanel/1.0'])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'q' => $query,
                        'format' => 'jsonv2',
                        'limit' => 10,
                        'addressdetails' => 1,
                    ]);
            } catch (\Throwable $e) {
                return [];
            }
            if (! $nominatim->ok()) {
                return [];
            }

            return collect($nominatim->json() ?? [])
                ->map(function ($row) {
                    $address = $row['address'] ?? [];
                    $name = trim((string) ($address['city'] ?? $address['town'] ?? $address['village'] ?? $address['hamlet'] ?? ''));
                    $admin = trim((string) ($address['state'] ?? ''));
                    $country = trim((string) ($address['country'] ?? ''));
                    $lat = isset($row['lat']) ? (float) $row['lat'] : null;
                    $lng = isset($row['lon']) ? (float) $row['lon'] : null;
                    if ($name === '') {
                        $name = trim((string) ($row['name'] ?? ''));
                    }
                    if ($name === '') {
                        $displayName = trim((string) ($row['display_name'] ?? ''));
                        $name = trim((string) explode(',', $displayName)[0]);
                    }
                    if ($name === '' || $country === '') {
                        return null;
                    }

                    return [
                        'name' => $name,
                        'state' => $admin,
                        'country' => $country,
                        'lat' => $lat,
                        'lng' => $lng,
                        'label' => collect([$name, $admin, $country])->filter()->implode(', '),
                    ];
                })
                ->filter()
                ->values()
                ->all();
        });

        $fallbackMatches = collect([...$recent, ...$popular])
            ->filter(function (array $item) use ($query): bool {
                $label = strtolower((string) ($item['label'] ?? ''));
                return str_contains($label, strtolower($query));
            })
            ->values();

        $merged = collect($data)
            ->merge($fallbackMatches)
            ->unique('label')
            ->take(10)
            ->values();

        if ($merged->isEmpty()) {
            $merged = collect([[
                'name' => $query,
                'state' => '',
                'country' => '',
                'lat' => null,
                'lng' => null,
                'label' => $query,
            ]]);
        }

        return response()->json(['data' => $merged]);
    }

    public function rememberRecent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_name' => ['required', 'string', 'max:190'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        $item = [
            'name' => $validated['location_name'],
            'state' => '',
            'country' => '',
            'lat' => isset($validated['latitude']) ? (float) $validated['latitude'] : null,
            'lng' => isset($validated['longitude']) ? (float) $validated['longitude'] : null,
            'label' => $validated['location_name'],
        ];

        $key = $this->recentKey($request);
        $existing = Cache::get($key, []);
        $next = collect([$item, ...$existing])->unique('label')->take(10)->values()->all();
        Cache::put($key, $next, now()->addDays(30));

        return response()->json([
            'data' => $next,
        ]);
    }

    private function recentLocations(Request $request): array
    {
        return Cache::get($this->recentKey($request), []);
    }

    private function recentKey(Request $request): string
    {
        return 'recent-locations:user:'.($request->user()?->id ?? 'guest');
    }

    private function popularLocations(): array
    {
        return [
            ['name' => 'Manali', 'state' => 'Himachal Pradesh', 'country' => 'India', 'lat' => 32.2432, 'lng' => 77.1892, 'label' => 'Manali, Himachal Pradesh, India'],
            ['name' => 'Goa', 'state' => 'Goa', 'country' => 'India', 'lat' => 15.2993, 'lng' => 74.1240, 'label' => 'Goa, India'],
            ['name' => 'Dubai', 'state' => 'Dubai', 'country' => 'United Arab Emirates', 'lat' => 25.2048, 'lng' => 55.2708, 'label' => 'Dubai, United Arab Emirates'],
        ];
    }

    private function mapGeoNamesRows(array $rows): array
    {
        return collect($rows)
            ->map(function ($row) {
                $name = trim((string) ($row['name'] ?? ''));
                $admin = trim((string) ($row['adminName1'] ?? ''));
                $country = trim((string) ($row['countryName'] ?? ''));
                $lat = isset($row['lat']) ? (float) $row['lat'] : null;
                $lng = isset($row['lng']) ? (float) $row['lng'] : null;
                if ($name === '' || $country === '') {
                    return null;
                }

                return [
                    'name' => $name,
                    'state' => $admin,
                    'country' => $country,
                    'lat' => $lat,
                    'lng' => $lng,
                    'label' => collect([$name, $admin, $country])->filter()->implode(', '),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }
}

