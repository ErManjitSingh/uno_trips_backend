<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ActivityLog::query()->with('user:id,name,email')->latest()->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'action' => ['required', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:100'],
            'target_type' => ['nullable', 'string', 'max:190'],
            'target_id' => ['nullable', 'integer'],
            'meta' => ['nullable', 'array'],
        ]);

        $log = ActivityLog::query()->create($data);

        return response()->json($log, 201);
    }

    public function show(ActivityLog $activityLog): JsonResponse
    {
        return response()->json($activityLog->load('user:id,name,email'));
    }

    public function update(Request $request, ActivityLog $activityLog): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'action' => ['sometimes', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:100'],
            'target_type' => ['nullable', 'string', 'max:190'],
            'target_id' => ['nullable', 'integer'],
            'meta' => ['nullable', 'array'],
        ]);

        $activityLog->update($data);

        return response()->json($activityLog->fresh());
    }

    public function destroy(ActivityLog $activityLog): JsonResponse
    {
        $activityLog->delete();

        return response()->json(['message' => 'Activity log deleted']);
    }
}

