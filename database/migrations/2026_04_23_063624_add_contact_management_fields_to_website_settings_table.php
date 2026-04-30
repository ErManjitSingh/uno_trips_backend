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
            if (! Schema::hasColumn('website_settings', 'company_name')) {
                $table->string('company_name')->nullable()->after('site_name');
            }
            if (! Schema::hasColumn('website_settings', 'support_email')) {
                $table->string('support_email')->nullable()->after('contact_email');
            }
            if (! Schema::hasColumn('website_settings', 'sales_email')) {
                $table->string('sales_email')->nullable()->after('support_email');
            }
            if (! Schema::hasColumn('website_settings', 'primary_phone')) {
                $table->string('primary_phone', 30)->nullable()->after('contact_phone');
            }
            if (! Schema::hasColumn('website_settings', 'secondary_phone')) {
                $table->string('secondary_phone', 30)->nullable()->after('primary_phone');
            }
            if (! Schema::hasColumn('website_settings', 'call_tracking_enabled')) {
                $table->boolean('call_tracking_enabled')->default(false)->after('whatsapp_number');
            }
            if (! Schema::hasColumn('website_settings', 'office_locations')) {
                $table->json('office_locations')->nullable()->after('call_tracking_enabled');
            }
            if (! Schema::hasColumn('website_settings', 'working_hours')) {
                $table->json('working_hours')->nullable()->after('office_locations');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('website_settings')) {
            return;
        }

        Schema::table('website_settings', function (Blueprint $table): void {
            foreach ([
                'company_name',
                'support_email',
                'sales_email',
                'primary_phone',
                'secondary_phone',
                'call_tracking_enabled',
                'office_locations',
                'working_hours',
            ] as $column) {
                if (Schema::hasColumn('website_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
