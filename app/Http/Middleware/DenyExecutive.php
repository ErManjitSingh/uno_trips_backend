<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DenyExecutive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isExecutive()) {
            abort(Response::HTTP_FORBIDDEN, 'This area is restricted to administrators.');
        }

        return $next($request);
    }
}
