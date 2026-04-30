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
            if (! Schema::hasColumn('website_settings', 'ga4_property_id')) {
                $table->string('ga4_property_id', 80)->nullable()->after('google_analytics_code');
            }
            if (! Schema::hasColumn('website_settings', 'ga4_service_account_email')) {
                $table->string('ga4_service_account_email')->nullable()->after('ga4_property_id');
            }
            if (! Schema::hasColumn('website_settings', 'ga4_json_key_path')) {
                $table->string('ga4_json_key_path')->nullable()->after('ga4_service_account_email');
            }
            if (! Schema::hasColumn('website_settings', 'ga4_last_snapshot')) {
                $table->json('ga4_last_snapshot')->nullable()->after('ga4_json_key_path');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('website_settings')) {
            return;
        }

        Schema::table('website_settings', function (Blueprint $table): void {
            foreach (['ga4_property_id', 'ga4_service_account_email', 'ga4_json_key_path', 'ga4_last_snapshot'] as $column) {
                if (Schema::hasColumn('website_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
