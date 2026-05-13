<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(Response::HTTP_FORBIDDEN, 'Only the super administrator can perform this action.');
        }

        return $next($request);
    }
}
