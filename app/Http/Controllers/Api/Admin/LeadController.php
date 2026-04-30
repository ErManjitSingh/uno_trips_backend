<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Lead::query()->with('assignee:id,name,email')->latest()->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:190'],
            'destination' => ['nullable', 'string', 'max:150'],
            'message' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['new', 'contacted', 'converted'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $lead = Lead::query()->create($data);

        return response()->json($lead, 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json($lead->load('assignee:id,name,email'));
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:140'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:190'],
            'destination' => ['nullable', 'string', 'max:150'],
            'message' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['new', 'contacted', 'converted'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $lead->update($data);

        return response()->json($lead->fresh());
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return response()->json(['message' => 'Lead deleted']);
    }
}

