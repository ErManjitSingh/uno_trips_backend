<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('role', 40)->default('super_admin')->after('password');
                $table->json('permissions')->nullable()->after('role');
            });
        }

        if (! Schema::hasTable('tour_packages')) {
            Schema::create('tour_packages', function (Blueprint $table): void {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('destination');
                $table->string('duration', 80);
                $table->decimal('price', 12, 2);
                $table->decimal('offer_price', 12, 2)->nullable();
                $table->json('itinerary')->nullable();
                $table->json('inclusions')->nullable();
                $table->json('exclusions')->nullable();
                $table->json('gallery_images')->nullable();
                $table->string('featured_image')->nullable();
                $table->string('package_type', 40)->default('domestic');
                $table->string('status', 30)->default('draft');
                $table->string('seo_meta_title')->nullable();
                $table->text('seo_meta_description')->nullable();
                $table->json('highlight_tags')->nullable();
                $table->boolean('is_popular')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table): void {
                $table->id();
                $table->string('full_name');
                $table->string('email')->unique();
                $table->string('phone', 30)->nullable();
                $table->string('address', 300)->nullable();
                $table->json('saved_packages')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('bookings')) {
            Schema::create('bookings', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('tour_package_id')->nullable()->constrained('tour_packages')->nullOnDelete();
                $table->string('customer')->nullable();
                $table->string('email')->nullable();
                $table->string('package_name')->nullable();
                $table->date('booking_date')->nullable();
                $table->date('travel_date')->nullable();
                $table->integer('guests')->nullable();
                $table->integer('traveler_count')->nullable();
                $table->decimal('amount', 12, 2)->nullable();
                $table->decimal('total_amount', 12, 2)->nullable();
                $table->string('booking_status', 40)->nullable();
                $table->string('status', 30)->default('new');
                $table->string('payment_status', 30)->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('email')->nullable()->index();
                $table->string('phone', 30)->nullable()->index();
                $table->string('source', 40)->default('website');
                $table->string('status', 30)->default('new');
                $table->text('message')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('follow_up_at')->nullable();
                $table->json('notes_timeline')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('blog_categories')) {
            Schema::create('blog_categories', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('blog_posts')) {
            Schema::create('blog_posts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('blog_category_id')->nullable()->constrained()->nullOnDelete();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('excerpt')->nullable();
                $table->longText('content');
                $table->string('featured_image')->nullable();
                $table->string('status', 30)->default('draft');
                $table->timestamp('published_at')->nullable();
                $table->string('seo_meta_title')->nullable();
                $table->text('seo_meta_description')->nullable();
                $table->boolean('is_popular')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('blog_comments')) {
            Schema::create('blog_comments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('blog_post_id')->constrained()->cascadeOnDelete();
                $table->string('author_name');
                $table->string('author_email');
                $table->text('comment');
                $table->boolean('is_approved')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('media_assets')) {
            Schema::create('media_assets', function (Blueprint $table): void {
                $table->id();
                $table->string('folder')->default('general');
                $table->string('file_name');
                $table->string('file_path');
                $table->string('mime_type', 80)->nullable();
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('alt_text')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('website_settings')) {
            Schema::create('website_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('site_name');
                $table->string('logo')->nullable();
                $table->string('contact_email')->nullable();
                $table->string('contact_phone', 30)->nullable();
                $table->string('whatsapp_number', 30)->nullable();
                $table->text('footer_content')->nullable();
                $table->string('facebook_url')->nullable();
                $table->string('instagram_url')->nullable();
                $table->json('smtp_settings')->nullable();
                $table->string('seo_meta_title')->nullable();
                $table->text('seo_meta_description')->nullable();
                $table->longText('google_analytics_code')->nullable();
                $table->longText('meta_pixel_code')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('testimonials')) {
            Schema::create('testimonials', function (Blueprint $table): void {
                $table->id();
                $table->string('customer_name');
                $table->unsignedTinyInteger('rating')->default(5);
                $table->string('photo')->nullable();
                $table->text('content');
                $table->boolean('is_approved')->default(false);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Intentionally left minimal for recovery migration.
    }
};
