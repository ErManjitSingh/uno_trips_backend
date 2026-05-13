<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContentApprovalResult extends Notification
{
    use Queueable;

    public function __construct(
        public string $contentType,
        public string $title,
        public bool $approved,
        public ?string $remarks = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $verb = $this->approved ? 'approved' : 'rejected';

        return [
            'title' => ucfirst($this->contentType).' '.$verb,
            'body' => $this->title,
            'remarks' => $this->remarks,
            'url' => $this->contentType === 'blog' ? '/admin/blogs' : '/admin/packages',
            'type' => 'content_'.$verb,
        ];
    }
}
