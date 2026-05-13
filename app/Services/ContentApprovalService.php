<?php

namespace App\Services;

use App\Enums\ApprovalStatus;
use App\Models\BlogPost;
use App\Models\TourPackage;
use App\Models\User;
use App\Notifications\BlogSubmittedForApproval;
use App\Notifications\ContentApprovalResult;
use App\Notifications\PackageSubmittedForApproval;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class ContentApprovalService
{
    public function notifyAdminsOfNewPackage(TourPackage $package): void
    {
        $admins = User::query()->where('role', 'super_admin')->where('status', 'active')->get();
        Notification::send($admins, new PackageSubmittedForApproval($package));
    }

    public function notifyAdminsOfNewBlog(BlogPost $post): void
    {
        $admins = User::query()->where('role', 'super_admin')->where('status', 'active')->get();
        Notification::send($admins, new BlogSubmittedForApproval($post));
    }

    public function approvePackage(TourPackage $package, User $admin, ?string $remarks = null): void
    {
        DB::transaction(function () use ($package, $admin, $remarks): void {
            $package->forceFill([
                'approval_status' => ApprovalStatus::Approved->value,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'approval_remarks' => $remarks,
                'status' => 'published',
            ])->save();

            if ($package->creator) {
                $package->creator->notify(new ContentApprovalResult('package', $package->title, true, $remarks));
            }
        });
    }

    public function rejectPackage(TourPackage $package, User $admin, ?string $remarks = null): void
    {
        DB::transaction(function () use ($package, $admin, $remarks): void {
            $package->forceFill([
                'approval_status' => ApprovalStatus::Rejected->value,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'approval_remarks' => $remarks,
                'status' => 'draft',
            ])->save();

            if ($package->creator) {
                $package->creator->notify(new ContentApprovalResult('package', $package->title, false, $remarks));
            }
        });
    }

    public function approveBlog(BlogPost $post, User $admin, ?string $remarks = null): void
    {
        DB::transaction(function () use ($post, $admin, $remarks): void {
            $post->forceFill([
                'approval_status' => ApprovalStatus::Approved->value,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'approval_remarks' => $remarks,
                'status' => 'published',
                'published_at' => $post->published_at ?? now(),
            ])->save();

            if ($post->author) {
                $post->author->notify(new ContentApprovalResult('blog', $post->title, true, $remarks));
            }
        });
    }

    public function rejectBlog(BlogPost $post, User $admin, ?string $remarks = null): void
    {
        DB::transaction(function () use ($post, $admin, $remarks): void {
            $post->forceFill([
                'approval_status' => ApprovalStatus::Rejected->value,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'approval_remarks' => $remarks,
                'status' => 'draft',
                'published_at' => null,
            ])->save();

            if ($post->author) {
                $post->author->notify(new ContentApprovalResult('blog', $post->title, false, $remarks));
            }
        });
    }
}
