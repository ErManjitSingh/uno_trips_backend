<?php

namespace App\Notifications;

use App\Models\BlogPost;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BlogSubmittedForApproval extends Notification
{
    use Queueable;

    public function __construct(public BlogPost $post)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New blog pending approval',
            'body' => $this->post->title,
            'url' => url('/admin/approvals'),
            'type' => 'blog_submitted',
            'blog_id' => $this->post->id,
        ];
    }
}
