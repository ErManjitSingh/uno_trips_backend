<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('website_settings')) {
            return;
        }

        Schema::table('website_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('website_settings', 'seo_title_template')) {
                $table->string('seo_title_template')->nullable()->after('seo_meta_title');
            }
            if (! Schema::hasColumn('website_settings', 'seo_keywords')) {
                $table->text('seo_keywords')->nullable()->after('seo_meta_description');
            }
            if (! Schema::hasColumn('website_settings', 'seo_robots_index')) {
                $table->boolean('seo_robots_index')->default(true)->after('seo_keywords');
            }
            if (! Schema::hasColumn('website_settings', 'seo_canonical_base')) {
                $table->string('seo_canonical_base')->nullable()->after('seo_robots_index');
            }
            if (! Schema::hasColumn('website_settings', 'seo_og_title')) {
                $table->string('seo_og_title')->nullable()->after('seo_canonical_base');
            }
            if (! Schema::hasColumn('website_settings', 'seo_og_description')) {
                $table->text('seo_og_description')->nullable()->after('seo_og_title');
            }
            if (! Schema::hasColumn('website_settings', 'seo_auto_slug_rules')) {
                $table->string('seo_auto_slug_rules')->nullable()->after('seo_og_description');
            }
            if (! Schema::hasColumn('website_settings', 'seo_schema_enabled')) {
                $table->boolean('seo_schema_enabled')->default(true)->after('seo_auto_slug_rules');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('website_settings')) {
            return;
        }

        Schema::table('website_settings', function (Blueprint $table): void {
            foreach ([
                'seo_title_template',
                'seo_keywords',
                'seo_robots_index',
                'seo_canonical_base',
                'seo_og_title',
                'seo_og_description',
                'seo_auto_slug_rules',
                'seo_schema_enabled',
            ] as $column) {
                if (Schema::hasColumn('website_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
