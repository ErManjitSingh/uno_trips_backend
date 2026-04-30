<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionTimeout
{
    private const LAST_ACTIVITY_KEY = 'admin.last_activity_at';
    private const TIMEOUT_MINUTES = 20;

    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('web')->check()) {
            return $next($request);
        }

        $lastActivity = (int) $request->session()->get(self::LAST_ACTIVITY_KEY, 0);
        $timeoutSeconds = self::TIMEOUT_MINUTES * 60;
        $now = now()->timestamp;

        if ($lastActivity > 0 && ($now - $lastActivity) >= $timeoutSeconds) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Session expired due to inactivity.',
                ], 401);
            }

            return redirect()->route('login')->with('error', 'Session expired due to inactivity.');
        }

        $request->session()->put(self::LAST_ACTIVITY_KEY, $now);

        return $next($request);
    }
}
