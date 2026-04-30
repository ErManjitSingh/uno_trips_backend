<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebsiteControlController extends Controller
{
    public function show(string $section): Response
    {
        return Inertia::render('Admin/WebsiteControl/Section', [
            'section' => $section,
        ]);
    }

    public function update(Request $request, string $section): RedirectResponse
    {
        return back()->with('success', ucfirst($section).' section updated.');
    }
}
