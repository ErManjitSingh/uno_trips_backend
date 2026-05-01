<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'city_id')) {
                $table->dropConstrainedForeignId('city_id');
            }
            if (! Schema::hasColumn('tour_packages', 'location_name')) {
                $table->string('location_name', 190)->nullable()->after('destination');
                $table->index('location_name');
            }
            if (! Schema::hasColumn('tour_packages', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('location_name');
            }
            if (! Schema::hasColumn('tour_packages', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });

        Schema::dropIfExists('cities');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('states');
        Schema::dropIfExists('countries');
    }

    public function down(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'location_name')) {
                $table->dropIndex(['location_name']);
                $table->dropColumn('location_name');
            }
            if (Schema::hasColumn('tour_packages', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('tour_packages', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (! Schema::hasColumn('tour_packages', 'city_id') && Schema::hasTable('cities')) {
                $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            }
        });
    }
};

