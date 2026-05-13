<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Hostinger / reverse proxy — X-Forwarded-* se HTTPS aur host sahi detect hon
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_PREFIX
                | Request::HEADER_X_FORWARDED_AWS_ELB
        );

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'admin.session.timeout' => \App\Http\Middleware\AdminSessionTimeout::class,
            'deny_executive' => \App\Http\Middleware\DenyExecutive::class,
            'super_admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (HttpExceptionInterface $e, Request $request) {
            if ($e->getStatusCode() !== 403 || ! $request->header('X-Inertia')) {
                return null;
            }

            $message = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException && $e->getMessage() !== ''
                ? $e->getMessage()
                : 'You do not have permission to view this page.';

            return Inertia::render('Errors/Forbidden', [
                'message' => $message,
            ])->toResponse($request)->setStatusCode(403);
        });
    })->create();
