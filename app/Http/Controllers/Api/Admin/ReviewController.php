<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
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
            ->with(['user:id,name,email', 'package:id,title,slug', 'repliedBy:id,name'])
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

        return response()->json($query->paginate(20)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'package_id' => ['nullable', 'exists:tour_packages,id'],
            'tour_package_id' => ['nullable', 'exists:tour_packages,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:160'],
            'review' => ['required', 'string'],
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected', 'spam'])],
            'service_rating' => ['nullable', 'integer', 'between:1,5'],
            'value_rating' => ['nullable', 'integer', 'between:1,5'],
            'location_rating' => ['nullable', 'integer', 'between:1,5'],
            'cleanliness_rating' => ['nullable', 'integer', 'between:1,5'],
            'pros' => ['nullable', 'string'],
            'cons' => ['nullable', 'string'],
            'travel_date' => ['nullable', 'date'],
            'trip_type' => ['nullable', 'string', 'max:80'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'max:300'],
            'is_verified_booking' => ['boolean'],
            'is_featured' => ['boolean'],
        ]);

        if (empty($data['tour_package_id']) && ! empty($data['package_id'])) {
            $data['tour_package_id'] = $data['package_id'];
        }
        $lowerReview = strtolower((string) ($data['review'] ?? ''));
        $spamHints = ['http://', 'https://', 'whatsapp', 'telegram', 'buy now', 'casino'];
        $spamScore = collect($spamHints)->reduce(function ($score, $hint) use ($lowerReview) {
            return str_contains($lowerReview, $hint) ? $score + 20 : $score;
        }, 0);
        if ($spamScore >= 40) {
            $data['status'] = 'spam';
            $data['is_approved'] = false;
            $data['spam_score'] = min(100, $spamScore);
        }
        $data['is_approved'] = ($data['status'] ?? 'pending') === 'approved';
        $review = Review::query()->create($data);

        return response()->json($review, 201);
    }

    public function show(Review $review): JsonResponse
    {
        return response()->json($review->load(['user:id,name,email', 'package:id,title,slug', 'repliedBy:id,name']));
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'package_id' => ['nullable', 'exists:tour_packages,id'],
            'tour_package_id' => ['nullable', 'exists:tour_packages,id'],
            'rating' => ['sometimes', 'integer', 'between:1,5'],
            'title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'review' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected', 'spam'])],
            'service_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'value_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'location_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'cleanliness_rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'pros' => ['sometimes', 'nullable', 'string'],
            'cons' => ['sometimes', 'nullable', 'string'],
            'travel_date' => ['sometimes', 'nullable', 'date'],
            'trip_type' => ['sometimes', 'nullable', 'string', 'max:80'],
            'images' => ['sometimes', 'nullable', 'array'],
            'images.*' => ['string', 'max:300'],
            'is_verified_booking' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'helpful_count' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (empty($data['tour_package_id']) && ! empty($data['package_id'])) {
            $data['tour_package_id'] = $data['package_id'];
        }
        if (isset($data['status'])) {
            $data['is_approved'] = $data['status'] === 'approved';
        }

        $review->update($data);

        return response()->json($review->fresh());
    }

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(['message' => 'Review deleted']);
    }

    public function approve(Review $review): JsonResponse
    {
        $review->update([
            'status' => 'approved',
            'is_approved' => true,
        ]);

        return response()->json(['message' => 'Review approved', 'review' => $review->fresh()]);
    }

    public function reject(Review $review): JsonResponse
    {
        $review->update([
            'status' => 'rejected',
            'is_approved' => false,
        ]);

        return response()->json(['message' => 'Review rejected', 'review' => $review->fresh()]);
    }

    public function reply(Request $request, Review $review): JsonResponse
    {
        $data = $request->validate([
            'reply' => ['required', 'string', 'max:3000'],
        ]);

        $review->update([
            'admin_reply' => trim($data['reply']),
            'admin_reply_by' => $request->user()?->id,
            'admin_reply_at' => now(),
        ]);

        return response()->json(['message' => 'Reply added', 'review' => $review->fresh()]);
    }
}

