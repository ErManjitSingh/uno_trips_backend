<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_assets', function (Blueprint $table): void {
            if (! Schema::hasColumn('media_assets', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->after('folder')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('media_assets', function (Blueprint $table): void {
            if (Schema::hasColumn('media_assets', 'uploaded_by')) {
                $table->dropConstrainedForeignId('uploaded_by');
            }
        });
    }
};
