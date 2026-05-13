<?php

namespace App\Notifications;

use App\Models\TourPackage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PackageSubmittedForApproval extends Notification
{
    use Queueable;

    public function __construct(public TourPackage $package)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New package pending approval',
            'body' => $this->package->title,
            'url' => url('/admin/approvals'),
            'type' => 'package_submitted',
            'package_id' => $this->package->id,
        ];
    }
}
