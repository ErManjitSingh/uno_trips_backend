<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function index(): JsonResponse
    {
        $bookings = Booking::query()->with(['user:id,name,email', 'package:id,title'])->latest()->paginate(20);

        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'package_id' => ['nullable', 'exists:tour_packages,id'],
            'tour_package_id' => ['nullable', 'exists:tour_packages,id'],
            'booking_date' => ['nullable', 'date'],
            'travel_date' => ['nullable', 'date'],
            'persons' => ['nullable', 'integer', 'min:1'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'booking_status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled'])],
            'payment_status' => ['required', Rule::in(['paid', 'unpaid'])],
        ]);

        if (empty($data['tour_package_id']) && ! empty($data['package_id'])) {
            $data['tour_package_id'] = $data['package_id'];
        }

        $booking = Booking::query()->create($data);

        return response()->json($booking, 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['user:id,name,email', 'package:id,title']));
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'package_id' => ['nullable', 'exists:tour_packages,id'],
            'tour_package_id' => ['nullable', 'exists:tour_packages,id'],
            'booking_date' => ['nullable', 'date'],
            'travel_date' => ['nullable', 'date'],
            'persons' => ['nullable', 'integer', 'min:1'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'booking_status' => ['sometimes', Rule::in(['pending', 'confirmed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['paid', 'unpaid'])],
        ]);

        if (empty($data['tour_package_id']) && ! empty($data['package_id'])) {
            $data['tour_package_id'] = $data['package_id'];
        }

        $booking->update($data);

        return response()->json($booking->fresh());
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json(['message' => 'Booking deleted']);
    }
}

