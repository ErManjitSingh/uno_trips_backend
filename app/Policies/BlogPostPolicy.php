<?php

namespace App\Policies;

use App\Enums\ApprovalStatus;
use App\Models\BlogPost;
use App\Models\User;

class BlogPostPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccessAdminContent();
    }

    public function view(User $user, BlogPost $blogPost): bool
    {
        if ($user->isExecutive()) {
            return (int) $blogPost->created_by === (int) $user->id;
        }

        return $user->canAccessAdminContent();
    }

    public function create(User $user): bool
    {
        return $user->isExecutive() || $user->canAccessAdminContent();
    }

    public function update(User $user, BlogPost $blogPost): bool
    {
        if ($user->isExecutive()) {
            if ((int) $blogPost->created_by !== (int) $user->id) {
                return false;
            }

            if ($blogPost->approval_status === ApprovalStatus::Approved->value && $blogPost->status === 'published') {
                return false;
            }

            return true;
        }

        return $user->canAccessAdminContent();
    }

    public function delete(User $user, BlogPost $blogPost): bool
    {
        if ($user->isExecutive()) {
            if ((int) $blogPost->created_by !== (int) $user->id) {
                return false;
            }

            return $blogPost->approval_status !== ApprovalStatus::Approved->value;
        }

        return $user->canAccessAdminContent();
    }

    public function manageSeo(User $user): bool
    {
        return $user->isSuperAdmin() || in_array($user->role, ['staff', 'sales', 'content_manager'], true);
    }

    public function quickPublish(User $user, BlogPost $blogPost): bool
    {
        return ! $user->isExecutive();
    }

    public function approve(User $user, BlogPost $blogPost): bool
    {
        return $user->isSuperAdmin();
    }
}
