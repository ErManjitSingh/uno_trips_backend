<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['notifications' => [], 'unread_count' => 0]);
        }

        $user = $request->user();
        $unreadCount = (int) $user->unreadNotifications()->count();

        $notifications = $user->notifications()
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'read_at' => $n->read_at?->toIso8601String(),
                'data' => $n->data,
                'created_at' => $n->created_at?->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['ok' => false], 404);
        }

        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'ok' => true,
            'unread_count' => (int) $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['ok' => true, 'unread_count' => 0]);
        }

        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['ok' => true, 'unread_count' => 0]);
    }
}
