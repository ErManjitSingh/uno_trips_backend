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
            if (! Schema::hasColumn('destinations', 'country')) {
                $table->string('country', 120)->nullable()->after('slug');
            }
            if (! Schema::hasColumn('destinations', 'district')) {
                $table->string('district', 120)->nullable()->after('state');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('destinations')) {
            return;
        }

        Schema::table('destinations', function (Blueprint $table): void {
            if (Schema::hasColumn('destinations', 'district')) {
                $table->dropColumn('district');
            }
            if (Schema::hasColumn('destinations', 'country')) {
                $table->dropColumn('country');
            }
        });
    }
};

