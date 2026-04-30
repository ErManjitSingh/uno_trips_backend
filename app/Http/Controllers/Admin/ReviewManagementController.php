<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReviewManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:160'],
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'spam'])],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'verified' => ['nullable', Rule::in(['yes', 'no'])],
            'sort' => ['nullable', Rule::in(['latest', 'highest_rating', 'most_helpful'])],
        ]);

        $sort = $filters['sort'] ?? 'latest';
        $search = $filters['search'] ?? null;

        $query = Review::query()
            ->with(['user:id,name,email', 'package:id,title,slug'])
            ->when($search, function ($builder) use ($search): void {
                $builder->where(function ($nested) use ($search): void {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('review', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('package', fn ($q) => $q->where('title', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn ($builder, $status) => $builder->where('status', $status))
            ->when($filters['rating'] ?? null, fn ($builder, $rating) => $builder->where('rating', $rating))
            ->when($filters['verified'] ?? null, fn ($builder, $verified) => $builder->where('is_verified_booking', $verified === 'yes'));

        if ($sort === 'highest_rating') {
            $query->orderByDesc('rating')->orderByDesc('created_at');
        } elseif ($sort === 'most_helpful') {
            $query->orderByDesc('helpful_count')->orderByDesc('created_at');
        } else {
            $query->latest();
        }

        $baseQuery = clone $query;
        $reviews = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
                'rating' => $filters['rating'] ?? '',
                'verified' => $filters['verified'] ?? '',
                'sort' => $sort,
            ],
            'analytics' => [
                'total_reviews' => (clone $baseQuery)->count(),
                'average_rating' => round((float) ((clone $baseQuery)->avg('rating') ?? 0), 1),
                'distribution' => collect(range(1, 5))
                    ->mapWithKeys(fn ($star) => [$star => (clone $baseQuery)->where('rating', $star)->count()]),
                'recent_reviews' => Review::query()
                    ->with(['user:id,name', 'package:id,title'])
                    ->latest()
                    ->limit(5)
                    ->get(),
            ],
        ]);
    }

    public function show(Review $review): Response
    {
        return Inertia::render('Admin/Reviews/Show', [
            'review' => $review->load(['user:id,name,email', 'package:id,title,slug', 'repliedBy:id,name']),
        ]);
    }

    public function approve(Review $review): RedirectResponse
    {
        $review->update(['status' => 'approved', 'is_approved' => true]);
        return back()->with('success', 'Review approved.');
    }

    public function reject(Review $review): RedirectResponse
    {
        $review->update(['status' => 'rejected', 'is_approved' => false]);
        return back()->with('success', 'Review rejected.');
    }

    public function spam(Review $review): RedirectResponse
    {
        $review->update(['status' => 'spam', 'is_approved' => false, 'spam_score' => 100]);
        return back()->with('success', 'Review marked as spam.');
    }

    public function destroy(Review $review): RedirectResponse
    {
        $review->delete();
        return back()->with('success', 'Review deleted.');
    }

    public function toggleFlags(Request $request, Review $review): RedirectResponse
    {
        $data = $request->validate([
            'is_verified_booking' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
        ]);
        $review->update($data);
        return back()->with('success', 'Review flags updated.');
    }

    public function reply(Request $request, Review $review): RedirectResponse
    {
        $data = $request->validate([
            'reply' => ['required', 'string', 'max:3000'],
        ]);

        $review->update([
            'admin_reply' => trim($data['reply']),
            'admin_reply_by' => $request->user()?->id,
            'admin_reply_at' => now(),
        ]);

        return back()->with('success', 'Reply saved.');
    }

    public function deleteReply(Review $review): RedirectResponse
    {
        $review->update([
            'admin_reply' => null,
            'admin_reply_by' => null,
            'admin_reply_at' => null,
        ]);

        return back()->with('success', 'Reply deleted.');
    }

    public function bulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:reviews,id'],
            'action' => ['required', Rule::in(['approve', 'reject', 'delete'])],
        ]);

        $query = Review::query()->whereIn('id', $data['ids']);
        if ($data['action'] === 'approve') {
            $query->update(['status' => 'approved', 'is_approved' => true]);
        } elseif ($data['action'] === 'reject') {
            $query->update(['status' => 'rejected', 'is_approved' => false]);
        } else {
            $query->delete();
        }

        return back()->with('success', 'Bulk action completed.');
    }
}

