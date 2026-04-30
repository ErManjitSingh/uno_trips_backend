<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'short_description')) {
                $table->text('short_description')->nullable()->after('destination');
            }
            if (! Schema::hasColumn('tour_packages', 'full_description')) {
                $table->longText('full_description')->nullable()->after('short_description');
            }
            if (! Schema::hasColumn('tour_packages', 'country')) {
                $table->string('country', 120)->nullable()->after('full_description');
            }
            if (! Schema::hasColumn('tour_packages', 'state')) {
                $table->string('state', 120)->nullable()->after('country');
            }
            if (! Schema::hasColumn('tour_packages', 'city')) {
                $table->string('city', 120)->nullable()->after('state');
            }
            if (! Schema::hasColumn('tour_packages', 'days')) {
                $table->unsignedSmallInteger('days')->nullable()->after('city');
            }
            if (! Schema::hasColumn('tour_packages', 'nights')) {
                $table->unsignedSmallInteger('nights')->nullable()->after('days');
            }
            if (! Schema::hasColumn('tour_packages', 'taxes_included')) {
                $table->boolean('taxes_included')->default(true)->after('nights');
            }
            if (! Schema::hasColumn('tour_packages', 'emi_available')) {
                $table->boolean('emi_available')->default(true)->after('taxes_included');
            }
            if (! Schema::hasColumn('tour_packages', 'coupon_eligible')) {
                $table->boolean('coupon_eligible')->default(true)->after('emi_available');
            }
            if (! Schema::hasColumn('tour_packages', 'video_url')) {
                $table->string('video_url')->nullable()->after('featured_image');
            }
            if (! Schema::hasColumn('tour_packages', 'faq_schema')) {
                $table->boolean('faq_schema')->default(true)->after('video_url');
            }
            if (! Schema::hasColumn('tour_packages', 'breadcrumb_schema')) {
                $table->boolean('breadcrumb_schema')->default(true)->after('faq_schema');
            }
            if (! Schema::hasColumn('tour_packages', 'sitemap_include')) {
                $table->boolean('sitemap_include')->default(true)->after('breadcrumb_schema');
            }
            if (! Schema::hasColumn('tour_packages', 'canonical_url')) {
                $table->string('canonical_url')->nullable()->after('sitemap_include');
            }
            if (! Schema::hasColumn('tour_packages', 'robots')) {
                $table->string('robots', 60)->nullable()->after('canonical_url');
            }
            if (! Schema::hasColumn('tour_packages', 'og_title')) {
                $table->string('og_title')->nullable()->after('robots');
            }
            if (! Schema::hasColumn('tour_packages', 'og_description')) {
                $table->text('og_description')->nullable()->after('og_title');
            }
            if (! Schema::hasColumn('tour_packages', 'schema_type')) {
                $table->string('schema_type', 80)->nullable()->after('og_description');
            }
            if (! Schema::hasColumn('tour_packages', 'primary_category')) {
                $table->string('primary_category', 120)->nullable()->after('schema_type');
            }
            if (! Schema::hasColumn('tour_packages', 'secondary_categories')) {
                $table->json('secondary_categories')->nullable()->after('primary_category');
            }
            if (! Schema::hasColumn('tour_packages', 'seasonal_categories')) {
                $table->json('seasonal_categories')->nullable()->after('secondary_categories');
            }
            if (! Schema::hasColumn('tour_packages', 'marketing_labels')) {
                $table->json('marketing_labels')->nullable()->after('seasonal_categories');
            }
            if (! Schema::hasColumn('tour_packages', 'seo_landing_pages')) {
                $table->json('seo_landing_pages')->nullable()->after('marketing_labels');
            }
            if (! Schema::hasColumn('tour_packages', 'homepage_display_category')) {
                $table->string('homepage_display_category', 120)->nullable()->after('seo_landing_pages');
            }
            if (! Schema::hasColumn('tour_packages', 'filter_priority')) {
                $table->unsignedInteger('filter_priority')->default(1)->after('homepage_display_category');
            }
        });
    }

    public function down(): void
    {
        // Non-destructive rollback intentionally omitted.
    }
};

