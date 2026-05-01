<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'included_features')) {
                $table->json('included_features')->nullable()->after('exclusions');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'included_features')) {
                $table->dropColumn('included_features');
            }
        });
    }
};

