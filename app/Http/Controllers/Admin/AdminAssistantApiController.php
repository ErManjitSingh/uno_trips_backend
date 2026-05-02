<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminIntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAssistantApiController extends Controller
{
    public function __construct(private readonly AdminIntelligenceService $intelligence) {}

    public function adminStatus(): JsonResponse
    {
        $report = $this->intelligence->fullReport();

        return response()->json($this->intelligence->adminStatusSnapshot($report));
    }

    public function systemAudit(): JsonResponse
    {
        return response()->json($this->intelligence->fullReport());
    }

    public function readinessScore(): JsonResponse
    {
        $report = $this->intelligence->fullReport();

        return response()->json([
            'readiness' => $report['readiness'],
            'recommendations' => $report['recommendations'],
            'alerts' => $report['alerts'],
            'generated_at' => $report['generated_at'],
        ]);
    }

    public function assistantChat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $report = $this->intelligence->fullReport();
        $answer = $this->intelligence->answerChat($validated['message'], $report);

        return response()->json([
            'reply' => $answer['reply'],
            'cards' => $answer['cards'] ?? [],
            'suggestions' => $answer['suggestions'] ?? [],
            'readiness_percent' => $report['readiness']['percent'],
        ]);
    }
}
