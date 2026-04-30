<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_popular');
            }

            if (! Schema::hasColumn('tour_packages', 'featured_position')) {
                $table->unsignedInteger('featured_position')->nullable()->after('is_featured');
            }

            if (! Schema::hasColumn('tour_packages', 'featured_badge')) {
                $table->string('featured_badge', 40)->nullable()->after('featured_position');
            }
        });

        if (! Schema::hasTable('featured_package_settings')) {
            Schema::create('featured_package_settings', function (Blueprint $table): void {
                $table->id();
                $table->unsignedTinyInteger('max_featured')->default(4);
                $table->boolean('auto_rotate')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('featured_package_settings')) {
            Schema::drop('featured_package_settings');
        }

        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'featured_badge')) {
                $table->dropColumn('featured_badge');
            }
            if (Schema::hasColumn('tour_packages', 'featured_position')) {
                $table->dropColumn('featured_position');
            }
            if (Schema::hasColumn('tour_packages', 'is_featured')) {
                $table->dropColumn('is_featured');
            }
        });
    }
};
