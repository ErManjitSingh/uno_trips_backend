<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['new', 'contacted', 'won', 'lost'])],
            'source' => ['nullable', Rule::in(['website', 'whatsapp', 'call_back', 'ads', 'other'])],
            'search' => ['nullable', 'string', 'max:120'],
        ]);

        $search = $filters['search'] ?? null;

        return Inertia::render('Admin/Leads/Index', [
            'leads' => Lead::query()
                ->with('assignee:id,name,email')
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($filters['source'] ?? null, fn ($query, $source) => $query->where('source', $source))
                ->when($search, function ($query) use ($search): void {
                    $query->where(function ($nested) use ($search): void {
                        $nested->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'staff' => User::query()->whereIn('role', ['staff', 'sales', 'super_admin'])->select('id', 'name')->get(),
            'filters' => $filters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('leads.manage') || $request->user()?->hasRole('sales', 'staff', 'super_admin'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'source' => ['required', Rule::in(['website', 'whatsapp', 'call_back', 'ads', 'other'])],
            'status' => ['required', Rule::in(['new', 'contacted', 'won', 'lost'])],
            'message' => ['required', 'string', 'max:2000'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'follow_up_at' => ['nullable', 'date'],
        ]);

        $lead = Lead::create($validated);
        ActivityLog::query()->create([
            'actor_id' => $request->user()?->id,
            'action' => 'lead.created',
            'target_type' => Lead::class,
            'target_id' => $lead->id,
            'meta' => ['status' => $lead->status, 'source' => $lead->source],
        ]);

        return back()->with('success', 'Lead saved.');
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('leads.manage') || $request->user()?->hasRole('sales', 'staff', 'super_admin'), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['new', 'contacted', 'won', 'lost'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes_timeline' => ['nullable', 'array'],
        ]);

        $lead->update($validated);
        ActivityLog::query()->create([
            'actor_id' => $request->user()?->id,
            'action' => 'lead.updated',
            'target_type' => Lead::class,
            'target_id' => $lead->id,
            'meta' => $validated,
        ]);

        return back()->with('success', 'Lead updated.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->hasPermission('leads.export') || $request->user()?->hasRole('sales', 'super_admin'), 403);

        $status = $request->query('status');
        $source = $request->query('source');

        $fileName = 'leads-export-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($status, $source): void {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Assigned To', 'Follow Up', 'Created At']);

            Lead::query()
                ->with('assignee:id,name')
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($source, fn ($query) => $query->where('source', $source))
                ->latest()
                ->chunk(200, function ($leads) use ($file): void {
                    foreach ($leads as $lead) {
                        fputcsv($file, [
                            $lead->id,
                            $lead->name,
                            $lead->email,
                            $lead->phone,
                            $lead->source,
                            $lead->status,
                            $lead->assignee?->name,
                            optional($lead->follow_up_at)->toDateTimeString(),
                            optional($lead->created_at)->toDateTimeString(),
                        ]);
                    }
                });

            fclose($file);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }
}
