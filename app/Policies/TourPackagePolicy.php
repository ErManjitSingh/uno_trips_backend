<?php

namespace App\Policies;

use App\Enums\ApprovalStatus;
use App\Models\TourPackage;
use App\Models\User;

class TourPackagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccessAdminContent();
    }

    public function view(User $user, TourPackage $tourPackage): bool
    {
        if ($user->isExecutive()) {
            return (int) $tourPackage->created_by === (int) $user->id;
        }

        return $user->canAccessAdminContent();
    }

    public function create(User $user): bool
    {
        return $user->isExecutive() || $user->canAccessAdminContent();
    }

    public function update(User $user, TourPackage $tourPackage): bool
    {
        if ($user->isExecutive()) {
            if ((int) $tourPackage->created_by !== (int) $user->id) {
                return false;
            }

            if ($tourPackage->approval_status === ApprovalStatus::Approved->value && $tourPackage->status === 'published') {
                return false;
            }

            return true;
        }

        return $user->canAccessAdminContent();
    }

    public function delete(User $user, TourPackage $tourPackage): bool
    {
        if ($user->isExecutive()) {
            if ((int) $tourPackage->created_by !== (int) $user->id) {
                return false;
            }

            return $tourPackage->approval_status !== ApprovalStatus::Approved->value;
        }

        return $user->canAccessAdminContent();
    }

    public function bulkDiscount(User $user): bool
    {
        return ! $user->isExecutive() && $user->canAccessAdminContent();
    }

    public function bulkDelete(User $user): bool
    {
        return ! $user->isExecutive() && $user->canAccessAdminContent();
    }

    public function approve(User $user, TourPackage $tourPackage): bool
    {
        return $user->isSuperAdmin();
    }
}
