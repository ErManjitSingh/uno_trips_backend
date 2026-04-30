<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            if (! Schema::hasColumn('reviews', 'title')) {
                $table->string('title', 160)->nullable()->after('rating');
            }
            if (! Schema::hasColumn('reviews', 'service_rating')) {
                $table->unsignedTinyInteger('service_rating')->nullable()->after('rating');
            }
            if (! Schema::hasColumn('reviews', 'value_rating')) {
                $table->unsignedTinyInteger('value_rating')->nullable()->after('service_rating');
            }
            if (! Schema::hasColumn('reviews', 'location_rating')) {
                $table->unsignedTinyInteger('location_rating')->nullable()->after('value_rating');
            }
            if (! Schema::hasColumn('reviews', 'cleanliness_rating')) {
                $table->unsignedTinyInteger('cleanliness_rating')->nullable()->after('location_rating');
            }
            if (! Schema::hasColumn('reviews', 'pros')) {
                $table->text('pros')->nullable()->after('review');
            }
            if (! Schema::hasColumn('reviews', 'cons')) {
                $table->text('cons')->nullable()->after('pros');
            }
            if (! Schema::hasColumn('reviews', 'travel_date')) {
                $table->date('travel_date')->nullable()->after('cons');
            }
            if (! Schema::hasColumn('reviews', 'trip_type')) {
                $table->string('trip_type', 80)->nullable()->after('travel_date');
            }
            if (! Schema::hasColumn('reviews', 'images')) {
                $table->json('images')->nullable()->after('trip_type');
            }
            if (! Schema::hasColumn('reviews', 'is_verified_booking')) {
                $table->boolean('is_verified_booking')->default(false)->after('is_approved');
            }
            if (! Schema::hasColumn('reviews', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_verified_booking');
            }
            if (! Schema::hasColumn('reviews', 'helpful_count')) {
                $table->unsignedInteger('helpful_count')->default(0)->after('is_featured');
            }
            if (! Schema::hasColumn('reviews', 'spam_score')) {
                $table->unsignedTinyInteger('spam_score')->default(0)->after('helpful_count');
            }
            if (! Schema::hasColumn('reviews', 'admin_reply')) {
                $table->text('admin_reply')->nullable()->after('spam_score');
            }
            if (! Schema::hasColumn('reviews', 'admin_reply_by')) {
                $table->foreignId('admin_reply_by')->nullable()->after('admin_reply')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('reviews', 'admin_reply_at')) {
                $table->timestamp('admin_reply_at')->nullable()->after('admin_reply_by');
            }
        });

        Schema::table('reviews', function (Blueprint $table): void {
            $table->index(['status', 'created_at']);
            $table->index(['rating', 'status']);
            $table->index(['is_verified_booking', 'status']);
            $table->index(['helpful_count', 'status']);
        });
    }

    public function down(): void
    {
        // Keep rollback non-destructive for existing production data.
    }
};

