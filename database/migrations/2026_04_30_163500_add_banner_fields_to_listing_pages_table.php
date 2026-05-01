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
            if (! Schema::hasColumn('listing_pages', 'banner_image')) {
                $table->string('banner_image', 300)->nullable()->after('title');
            }
            if (! Schema::hasColumn('listing_pages', 'banner_overlay_text')) {
                $table->string('banner_overlay_text', 190)->nullable()->after('banner_image');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('listing_pages')) {
            return;
        }

        Schema::table('listing_pages', function (Blueprint $table): void {
            foreach (['banner_image', 'banner_overlay_text'] as $column) {
                if (Schema::hasColumn('listing_pages', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
