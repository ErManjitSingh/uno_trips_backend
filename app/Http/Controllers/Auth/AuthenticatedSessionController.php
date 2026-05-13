<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'The provided credentials are incorrect.',
            ]);
        }

        $user = Auth::user();
        if (! $user->canAccessAdminContent()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'This account cannot access the admin panel.',
            ]);
        }

        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        ActivityLog::query()->create([
            'actor_id' => $user->id,
            'action' => 'auth.login',
            'module' => 'auth',
            'target_type' => null,
            'target_id' => null,
            'meta' => [
                'ip' => $request->ip(),
                'user_agent' => \Illuminate\Support\Str::limit((string) $request->userAgent(), 500, ''),
            ],
        ]);

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function apiLogout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
