<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('destinations')) {
            return;
        }

        Schema::table('destinations', function (Blueprint $table): void {
            if (! Schema::hasColumn('destinations', 'city')) {
                $table->string('city', 120)->nullable()->after('district');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('destinations')) {
            return;
        }

        Schema::table('destinations', function (Blueprint $table): void {
            if (Schema::hasColumn('destinations', 'city')) {
                $table->dropColumn('city');
            }
        });
    }
};

