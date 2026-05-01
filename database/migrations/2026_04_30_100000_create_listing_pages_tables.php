<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('listing_page_categories')) {
            Schema::create('listing_page_categories', function (Blueprint $table): void {
                $table->id();
                $table->string('name', 120);
                $table->string('slug', 150)->unique();
                $table->string('status', 20)->default('active');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['status', 'sort_order'], 'listing_page_categories_status_sort_idx');
            });
        }

        if (! Schema::hasTable('listing_pages')) {
            Schema::create('listing_pages', function (Blueprint $table): void {
                $table->id();
                $table->string('title', 190);
                $table->string('slug', 210)->unique();
                $table->string('page_type', 30)->default('custom');
                $table->string('status', 20)->default('active');
                $table->foreignId('listing_page_category_id')->nullable()->constrained('listing_page_categories')->nullOnDelete();
                $table->json('filters_json')->nullable();
                $table->string('meta_title', 190)->nullable();
                $table->text('meta_description')->nullable();
                $table->text('meta_keywords')->nullable();
                $table->string('canonical_url', 300)->nullable();
                $table->longText('schema_json')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['status', 'sort_order'], 'listing_pages_status_sort_idx');
                $table->index(['page_type', 'status'], 'listing_pages_type_status_idx');
                $table->index(['listing_page_category_id', 'status'], 'listing_pages_category_status_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('listing_pages')) {
            Schema::drop('listing_pages');
        }

        if (Schema::hasTable('listing_page_categories')) {
            Schema::drop('listing_page_categories');
        }
    }
};
