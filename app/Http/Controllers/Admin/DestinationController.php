<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DestinationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Destinations/Index', [
            'destinations' => Destination::query()->latest()->paginate(12),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $rules = $this->baseRules();
        $rules['districts_input'] = ['nullable', 'string', 'max:10000', 'required_without_all:district,district_city_map_input'];
        $rules['cities_input'] = ['nullable', 'string', 'max:10000'];
        $rules['district_city_map_input'] = ['nullable', 'string', 'max:20000'];

        $validated = $request->validate($rules);
        $mapPairs = $this->parseDistrictCityMap((string) ($validated['district_city_map_input'] ?? ''));

        if (! empty($mapPairs)) {
            foreach ($mapPairs as $pair) {
                $payload = $this->payloadFromValidated($validated, $pair['city'], $pair['district']);
                $payload['slug'] = $this->uniqueSlug($payload['slug'], null);
                Destination::query()->create($payload);
            }

            return back()->with('success', 'Destination created.');
        }

        $districts = collect(preg_split('/[\r\n,]+/', (string) ($validated['districts_input'] ?? '')))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->unique()
            ->values();

        if ($districts->isEmpty()) {
            $districts = collect([$validated['district'] ?? ''])
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->values();
        }

        $cities = collect(preg_split('/[\r\n,]+/', (string) ($validated['cities_input'] ?? '')))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->unique()
            ->values();

        if ($cities->isEmpty() && ! empty($validated['city'])) {
            $cities = collect([(string) $validated['city']])->filter()->values();
        }

        if ($districts->isEmpty()) {
            $districts = collect([$validated['name'] ?? ''])
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->values();
        }

        foreach ($districts as $districtName) {
            if ($cities->isNotEmpty()) {
                foreach ($cities as $cityName) {
                    $payload = $this->payloadFromValidated($validated, (string) $cityName, (string) $districtName);
                    $payload['slug'] = $this->uniqueSlug($payload['slug'], null);
                    Destination::query()->create($payload);
                }
                continue;
            }

            $payload = $this->payloadFromValidated($validated, (string) $districtName, (string) $districtName);
            $payload['slug'] = $this->uniqueSlug($payload['slug'], null);
            Destination::query()->create($payload);
        }

        return back()->with('success', 'Destination created.');
    }

    public function update(Request $request, Destination $destination): RedirectResponse
    {
        $rules = $this->baseRules($destination->id);
        $validated = $request->validate($rules);

        $payload = $this->payloadFromValidated(
            $validated,
            (string) ($validated['city'] ?? $validated['district'] ?? $validated['name']),
            (string) ($validated['district'] ?? '')
        );
        $payload['slug'] = $this->uniqueSlug($payload['slug'], $destination->id);
        $destination->update($payload);

        return back()->with('success', 'Destination updated.');
    }

    public function destroy(Destination $destination): RedirectResponse
    {
        $destination->delete();

        return back()->with('success', 'Destination deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function baseRules(?int $ignoreId = null): array
    {
        $slugRule = ['nullable', 'string', 'max:130', 'unique:destinations,slug'];
        if ($ignoreId) {
            $slugRule = ['nullable', 'string', 'max:130', 'unique:destinations,slug,'.$ignoreId];
        }

        $rules = [
            'name' => ['nullable', 'string', 'max:120'],
            'slug' => $slugRule,
            'state' => ['nullable', 'string', 'max:120'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'is_featured' => ['boolean'],
        ];

        if (Schema::hasColumn('destinations', 'country')) {
            $rules['country'] = ['required', 'string', 'max:120'];
        }
        if (Schema::hasColumn('destinations', 'district')) {
            $rules['district'] = ['nullable', 'string', 'max:120'];
        }
        if (Schema::hasColumn('destinations', 'city')) {
            $rules['city'] = ['nullable', 'string', 'max:120'];
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function payloadFromValidated(array $validated, string $cityName, ?string $districtName = null): array
    {
        $city = trim($cityName);
        $district = trim((string) ($districtName ?? $validated['district'] ?? ''));
        $fallbackName = $city !== '' ? $city : ($district !== '' ? $district : trim((string) ($validated['name'] ?? '')));
        $slugSource = $city !== '' ? $city : ($validated['name'] ?? $district);

        $payload = [
            'name' => $fallbackName,
            'slug' => $this->normalizeSlug((string) $validated['slug'], (string) $slugSource),
            'state' => $validated['state'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
        ];

        if (array_key_exists('country', $validated)) {
            $payload['country'] = $validated['country'];
        }
        if (array_key_exists('district', $validated)) {
            $payload['district'] = $validated['district'];
        }
        if (Schema::hasColumn('destinations', 'city')) {
            $payload['city'] = $city !== '' ? $city : null;
        }

        return $payload;
    }

    private function normalizeSlug(string $inputSlug, string $source): string
    {
        $base = trim($inputSlug) !== '' ? trim($inputSlug) : trim($source);
        $slug = strtolower($base);
        $slug = preg_replace('/[^\w\s-]/', '', $slug) ?? '';
        $slug = preg_replace('/\s+/', '-', $slug) ?? '';
        $slug = preg_replace('/-+/', '-', $slug) ?? '';

        return trim($slug, '-');
    }

    private function uniqueSlug(string $baseSlug, ?int $ignoreId): string
    {
        $slug = $baseSlug !== '' ? $baseSlug : 'destination';
        $candidate = $slug;
        $suffix = 2;

        while (
            Destination::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = "{$slug}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    /**
     * @return list<array{district: string, city: string}>
     */
    private function parseDistrictCityMap(string $raw): array
    {
        $pairs = [];
        $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];

        foreach ($lines as $line) {
            $clean = trim((string) $line);
            if ($clean === '') {
                continue;
            }

            if (str_contains($clean, '=>')) {
                [$districtPart, $citiesPart] = explode('=>', $clean, 2);
            } elseif (str_contains($clean, ':')) {
                [$districtPart, $citiesPart] = explode(':', $clean, 2);
            } elseif (str_contains($clean, '-')) {
                [$districtPart, $citiesPart] = explode('-', $clean, 2);
            } else {
                continue;
            }
            $district = trim($districtPart);
            if ($district === '') {
                continue;
            }

            $cities = collect(preg_split('/[,|]+/', $citiesPart) ?: [])
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($cities)) {
                $pairs[] = ['district' => $district, 'city' => $district];
                continue;
            }

            foreach ($cities as $city) {
                $pairs[] = ['district' => $district, 'city' => $city];
            }
        }

        return $pairs;
    }
}
