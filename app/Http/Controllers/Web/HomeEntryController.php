<?php

namespace App\Http\Controllers\Web;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class HomeEntryController
{
    public function __invoke(): RedirectResponse
    {
        return Auth::check()
            ? redirect('/admin/dashboard')
            : redirect('/login');
    }
}
