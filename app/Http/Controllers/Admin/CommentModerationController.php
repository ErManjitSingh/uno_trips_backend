<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommentModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $spamWords = ['buy now', 'crypto', 'free money', 'click here', 'http://', 'https://'];
        $perPage = min(max((int) $request->integer('per_page', 50), 10), 100);

        $comments = BlogComment::query()
            ->with('post:id,title,slug')
            ->latest()
            ->select(['id', 'blog_post_id', 'author_name', 'comment', 'is_approved', 'created_at'])
            ->paginate($perPage)
            ->through(function (BlogComment $comment) use ($spamWords): array {
                $lower = strtolower($comment->comment ?? '');
                $isSpam = collect($spamWords)->contains(fn (string $word) => str_contains($lower, $word));

                return [
                    'id' => $comment->id,
                    'user_name' => $comment->author_name,
                    'comment' => $comment->comment,
                    'post_name' => $comment->post?->title ?? 'Unknown Post',
                    'post_slug' => $comment->post?->slug,
                    'date' => optional($comment->created_at)->toDateTimeString(),
                    'status' => $comment->is_approved ? 'Approved' : 'Pending',
                    'is_spam' => $isSpam,
                ];
            })
            ->withQueryString();

        return Inertia::render('Admin/BlogComments/Index', [
            'comments' => $comments,
        ]);
    }

    public function approve(BlogComment $comment): RedirectResponse
    {
        $comment->update(['is_approved' => true]);

        return back()->with('success', 'Comment approved.');
    }

    public function reject(BlogComment $comment): RedirectResponse
    {
        $comment->delete();

        return back()->with('success', 'Comment rejected and removed.');
    }

    public function bulkModerate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:blog_comments,id'],
        ]);

        if ($validated['action'] === 'approve') {
            BlogComment::query()->whereIn('id', $validated['ids'])->update(['is_approved' => true]);

            return back()->with('success', 'Selected comments approved.');
        }

        BlogComment::query()->whereIn('id', $validated['ids'])->delete();

        return back()->with('success', 'Selected comments rejected.');
    }
}
