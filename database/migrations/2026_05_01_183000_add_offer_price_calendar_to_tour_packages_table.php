<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'offer_price_calendar')) {
                $table->json('offer_price_calendar')->nullable()->after('offer_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'offer_price_calendar')) {
                $table->dropColumn('offer_price_calendar');
            }
        });
    }
};

