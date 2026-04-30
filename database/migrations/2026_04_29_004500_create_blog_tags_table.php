<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blog_tags')) {
            return;
        }

        Schema::create('blog_tags', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('slug', 140)->unique();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();
            $table->index('usage_count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_tags');
    }
};
