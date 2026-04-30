<?php

use App\Models\ActivityLog;
use App\Models\BlogPost;
use App\Models\TourPackage;
use App\Support\ImageVariantManager;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('activity:prune', function () {
    $deleted = ActivityLog::query()
        ->where('created_at', '<', now()->subDays(5))
        ->delete();

    $this->info("Pruned {$deleted} activity log records older than 5 days.");
})->purpose('Delete activity logs older than 5 days');

Artisan::command('images:backfill-variants {--dry-run : Only count images, do not generate}', function () {
    $imageManager = app(ImageVariantManager::class);
    $dryRun = (bool) $this->option('dry-run');

    $paths = TourPackage::query()
        ->whereNotNull('featured_image')
        ->pluck('featured_image')
        ->merge(
            BlogPost::query()
                ->whereNotNull('featured_image')
                ->pluck('featured_image')
        )
        ->filter(fn ($path) => is_string($path) && $path !== '' && ! str_starts_with($path, 'http'))
        ->unique()
        ->values();

    if ($paths->isEmpty()) {
        $this->info('No local images found for backfill.');

        return;
    }

    $this->info("Found {$paths->count()} image(s) to process.");

    if ($dryRun) {
        $this->line('Dry run complete. No variants generated.');

        return;
    }

    $bar = $this->output->createProgressBar($paths->count());
    $bar->start();

    $processed = 0;
    foreach ($paths as $path) {
        $imageManager->generateForExisting($path, 'public');
        $processed++;
        $bar->advance();
    }

    $bar->finish();
    $this->newLine(2);
    $this->info("Backfill completed for {$processed} image(s).");
})->purpose('Generate responsive variants for existing images');

Schedule::command('activity:prune')->dailyAt('02:00');
