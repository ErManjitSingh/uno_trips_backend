<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => Booking::query()->latest()->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Booking::query()->create($request->all());

        return back()->with('success', 'Booking created.');
    }

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        $booking->update($request->all());

        return back()->with('success', 'Booking updated.');
    }
}
