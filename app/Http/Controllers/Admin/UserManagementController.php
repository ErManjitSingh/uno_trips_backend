<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BlogPost;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'max:20'],
        ]);

        $users = User::query()
            ->when($filters['search'] ?? null, function ($q, $search): void {
                $q->where(function ($nested) use ($search): void {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                    'packages_count' => TourPackage::query()->where('created_by', $user->id)->count(),
                    'blogs_count' => BlogPost::query()->where('created_by', $user->id)->count(),
                ];
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'role' => $filters['role'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'max:120'],
            'role' => ['required', Rule::in(['executive'])],
            'status' => ['required', Rule::in(['active', 'disabled'])],
        ]);

        User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'role' => $data['role'],
            'status' => $data['status'],
            'created_by' => $request->user()->id,
        ]);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'user.created',
            'module' => 'users',
            'target_type' => User::class,
            'target_id' => null,
            'meta' => ['email' => $data['email'], 'role' => $data['role']],
        ]);

        return back()->with('success', 'User created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8', 'max:120'],
            'status' => ['required', Rule::in(['active', 'disabled'])],
        ]);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'],
        ];
        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }
        $user->update($payload);

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'user.updated',
            'module' => 'users',
            'target_type' => User::class,
            'target_id' => $user->id,
            'meta' => ['email' => $user->email],
        ]);

        return back()->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('delete', $user);

        $user->delete();

        ActivityLog::query()->create([
            'actor_id' => $request->user()->id,
            'action' => 'user.deleted',
            'module' => 'users',
            'target_type' => User::class,
            'target_id' => $user->id,
            'meta' => ['email' => $user->email],
        ]);

        return back()->with('success', 'User deleted.');
    }
}
