<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_meta', function (Blueprint $table): void {
            $table->id();
            $table->string('entity_type', 40); // page|blog_post|tour_package
            $table->unsignedBigInteger('entity_id')->default(0);
            $table->string('page_key', 80)->default('');

            $table->string('slug', 190)->nullable();
            $table->string('meta_title', 190)->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords', 500)->nullable();
            $table->string('canonical_url', 300)->nullable();

            $table->string('og_title', 190)->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image', 300)->nullable();
            $table->string('og_url', 300)->nullable();

            $table->string('twitter_title', 190)->nullable();
            $table->text('twitter_description')->nullable();
            $table->string('twitter_image', 300)->nullable();

            $table->boolean('robots_index')->default(true);
            $table->boolean('robots_follow')->default(true);
            $table->boolean('include_in_sitemap')->default(true);

            $table->string('schema_type', 60)->nullable();
            $table->longText('json_ld')->nullable();

            $table->string('image_alt', 255)->nullable();
            $table->string('image_title', 255)->nullable();
            $table->string('image_file_name', 255)->nullable();

            $table->timestamps();

            $table->unique(['entity_type', 'entity_id', 'page_key'], 'seo_meta_entity_unique');
            $table->index(['entity_type', 'entity_id']);
            $table->index(['entity_type', 'page_key']);
        });

        Schema::create('seo_technical_settings', function (Blueprint $table): void {
            $table->id();
            $table->boolean('lazy_load_enabled')->default(true);
            $table->boolean('minify_assets_enabled')->default(false);
            $table->boolean('sitemap_auto_generate')->default(true);
            $table->longText('robots_txt')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_technical_settings');
        Schema::dropIfExists('seo_meta');
    }
};

