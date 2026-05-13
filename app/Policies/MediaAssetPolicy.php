<?php

namespace App\Policies;

use App\Models\MediaAsset;
use App\Models\User;

class MediaAssetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccessAdminContent();
    }

    public function create(User $user): bool
    {
        return $user->canAccessAdminContent();
    }

    public function delete(User $user, MediaAsset $mediaAsset): bool
    {
        if ($user->isExecutive()) {
            return (int) ($mediaAsset->uploaded_by ?? 0) === (int) $user->id;
        }

        return $user->canAccessAdminContent();
    }
}
