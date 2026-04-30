<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('blog_post_tag')) {
            Schema::create('blog_post_tag', function (Blueprint $table): void {
                $table->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
                $table->foreignId('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
                $table->primary(['blog_post_id', 'blog_tag_id']);
            });
        }

        if (! Schema::hasTable('blog_post_category')) {
            Schema::create('blog_post_category', function (Blueprint $table): void {
                $table->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
                $table->foreignId('blog_category_id')->constrained('blog_categories')->cascadeOnDelete();
                $table->primary(['blog_post_id', 'blog_category_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_category');
        Schema::dropIfExists('blog_post_tag');
    }
};
