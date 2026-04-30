<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tour_packages')) {
            Schema::table('tour_packages', function (Blueprint $table): void {
                $table->index('destination', 'tour_packages_destination_perf_idx');
                $table->index(['status', 'created_at'], 'tour_packages_status_created_at_perf_idx');
            });
        }

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table): void {
                $table->index('source', 'leads_source_perf_idx');
                $table->index(['status', 'created_at'], 'leads_status_created_at_perf_idx');
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->index(['status', 'created_at'], 'bookings_status_created_at_perf_idx');
                $table->index('tour_package_id', 'bookings_tour_package_id_perf_idx');
            });
        }

        if (Schema::hasTable('destinations')) {
            Schema::table('destinations', function (Blueprint $table): void {
                $table->index('is_featured', 'destinations_is_featured_perf_idx');
            });
        }

        if (Schema::hasTable('blog_posts')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->index(['status', 'published_at'], 'blog_posts_status_published_at_perf_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tour_packages')) {
            Schema::table('tour_packages', function (Blueprint $table): void {
                $table->dropIndex('tour_packages_destination_perf_idx');
                $table->dropIndex('tour_packages_status_created_at_perf_idx');
            });
        }

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table): void {
                $table->dropIndex('leads_source_perf_idx');
                $table->dropIndex('leads_status_created_at_perf_idx');
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropIndex('bookings_status_created_at_perf_idx');
                $table->dropIndex('bookings_tour_package_id_perf_idx');
            });
        }

        if (Schema::hasTable('destinations')) {
            Schema::table('destinations', function (Blueprint $table): void {
                $table->dropIndex('destinations_is_featured_perf_idx');
            });
        }

        if (Schema::hasTable('blog_posts')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->dropIndex('blog_posts_status_published_at_perf_idx');
            });
        }
    }
};
