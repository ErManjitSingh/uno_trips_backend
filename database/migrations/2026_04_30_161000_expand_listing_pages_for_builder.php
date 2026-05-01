<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('listing_pages')) {
            return;
        }

        Schema::table('listing_pages', function (Blueprint $table): void {
            if (! Schema::hasColumn('listing_pages', 'packages_json')) {
                $table->json('packages_json')->nullable()->after('filters_json');
            }
            if (! Schema::hasColumn('listing_pages', 'content')) {
                $table->longText('content')->nullable()->after('packages_json');
            }
            if (! Schema::hasColumn('listing_pages', 'read_more')) {
                $table->longText('read_more')->nullable()->after('content');
            }
            if (! Schema::hasColumn('listing_pages', 'tags')) {
                $table->json('tags')->nullable()->after('read_more');
            }
            if (! Schema::hasColumn('listing_pages', 'seo_meta')) {
                $table->json('seo_meta')->nullable()->after('tags');
            }
            if (! Schema::hasColumn('listing_pages', 'blogs_json')) {
                $table->json('blogs_json')->nullable()->after('seo_meta');
            }
            if (! Schema::hasColumn('listing_pages', 'internal_links_json')) {
                $table->json('internal_links_json')->nullable()->after('blogs_json');
            }
            if (! Schema::hasColumn('listing_pages', 'filter_controls_json')) {
                $table->json('filter_controls_json')->nullable()->after('internal_links_json');
            }
            if (! Schema::hasColumn('listing_pages', 'publish_at')) {
                $table->timestamp('publish_at')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('listing_pages')) {
            return;
        }

        Schema::table('listing_pages', function (Blueprint $table): void {
            foreach ([
                'packages_json',
                'content',
                'read_more',
                'tags',
                'seo_meta',
                'blogs_json',
                'internal_links_json',
                'filter_controls_json',
                'publish_at',
            ] as $column) {
                if (Schema::hasColumn('listing_pages', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
