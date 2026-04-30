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
            if (! Schema::hasColumn('website_settings', 'whatsapp_default_message')) {
                $table->text('whatsapp_default_message')->nullable()->after('whatsapp_number');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_floating_enabled')) {
                $table->boolean('whatsapp_floating_enabled')->default(true)->after('whatsapp_default_message');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_button_position')) {
                $table->string('whatsapp_button_position', 10)->default('right')->after('whatsapp_floating_enabled');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_button_style')) {
                $table->string('whatsapp_button_style', 10)->default('rounded')->after('whatsapp_button_position');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_auto_reply_message')) {
                $table->text('whatsapp_auto_reply_message')->nullable()->after('whatsapp_button_style');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_business_hours_auto_response')) {
                $table->boolean('whatsapp_business_hours_auto_response')->default(false)->after('whatsapp_auto_reply_message');
            }
            if (! Schema::hasColumn('website_settings', 'whatsapp_agent_numbers')) {
                $table->json('whatsapp_agent_numbers')->nullable()->after('whatsapp_business_hours_auto_response');
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
                'whatsapp_default_message',
                'whatsapp_floating_enabled',
                'whatsapp_button_position',
                'whatsapp_button_style',
                'whatsapp_auto_reply_message',
                'whatsapp_business_hours_auto_response',
                'whatsapp_agent_numbers',
            ] as $column) {
                if (Schema::hasColumn('website_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
