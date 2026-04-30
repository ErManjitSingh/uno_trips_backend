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
                $table->index(['status', 'created_at'], 'tour_packages_status_created_idx');
                $table->index(['package_type', 'status'], 'tour_packages_type_status_idx');
                $table->index(['destination', 'status'], 'tour_packages_destination_status_idx');
                $table->index(['is_popular', 'created_at'], 'tour_packages_popular_created_idx');
                $table->index(['offer_price', 'price'], 'tour_packages_offer_price_idx');
            });
        }

        if (Schema::hasTable('blog_posts')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->index(['status', 'published_at'], 'blog_posts_status_published_idx');
                $table->index(['blog_category_id', 'published_at'], 'blog_posts_category_published_idx');
                $table->index(['slug'], 'blog_posts_slug_idx');
            });
        }

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table): void {
                $table->index(['status', 'source', 'created_at'], 'leads_status_source_created_idx');
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->index(['status', 'created_at'], 'bookings_status_created_idx');
                $table->index(['payment_status', 'created_at'], 'bookings_payment_created_idx');
            });
        }

        if (Schema::hasTable('package_categories')) {
            Schema::table('package_categories', function (Blueprint $table): void {
                $table->index(['status', 'type', 'name'], 'package_categories_status_type_name_idx');
                $table->index(['position'], 'package_categories_position_idx');
                $table->index(['parent_id'], 'package_categories_parent_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tour_packages')) {
            Schema::table('tour_packages', function (Blueprint $table): void {
                $table->dropIndex('tour_packages_status_created_idx');
                $table->dropIndex('tour_packages_type_status_idx');
                $table->dropIndex('tour_packages_destination_status_idx');
                $table->dropIndex('tour_packages_popular_created_idx');
                $table->dropIndex('tour_packages_offer_price_idx');
            });
        }

        if (Schema::hasTable('blog_posts')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->dropIndex('blog_posts_status_published_idx');
                $table->dropIndex('blog_posts_category_published_idx');
                $table->dropIndex('blog_posts_slug_idx');
            });
        }

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table): void {
                $table->dropIndex('leads_status_source_created_idx');
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->dropIndex('bookings_status_created_idx');
                $table->dropIndex('bookings_payment_created_idx');
            });
        }

        if (Schema::hasTable('package_categories')) {
            Schema::table('package_categories', function (Blueprint $table): void {
                $table->dropIndex('package_categories_status_type_name_idx');
                $table->dropIndex('package_categories_position_idx');
                $table->dropIndex('package_categories_parent_idx');
            });
        }
    }
};
