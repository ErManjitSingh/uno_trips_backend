<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'message' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:40'],
        ]);

        $utm = array_filter([
            'utm_source' => $request->query('utm_source'),
            'utm_medium' => $request->query('utm_medium'),
            'utm_campaign' => $request->query('utm_campaign'),
            'utm_term' => $request->query('utm_term'),
            'utm_content' => $request->query('utm_content'),
            'landing_page' => $request->fullUrl(),
        ]);

        Lead::query()->create([
            ...$validated,
            'status' => 'new',
            'source' => $validated['source'] ?? 'website',
            'notes_timeline' => [
                [
                    'at' => now()->toIso8601String(),
                    'note' => 'Lead captured from website inquiry form.',
                    'meta' => $utm,
                ],
            ],
        ]);

        return redirect()->route('thank-you');
    }
}
