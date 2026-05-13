<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        if ($model->isSuperAdmin() && User::query()->where('role', 'super_admin')->count() <= 1) {
            return false;
        }

        return $user->isSuperAdmin() && (int) $model->id !== (int) $user->id;
    }

    public function resetPassword(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }
}
