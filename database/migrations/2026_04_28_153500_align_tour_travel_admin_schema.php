<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status', 20)->default('active')->after('role');
            }
            $table->index('role');
            $table->index('status');
        });

        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'description')) {
                $table->longText('description')->nullable()->after('title');
            }
            if (! Schema::hasColumn('tour_packages', 'location')) {
                $table->string('location', 150)->nullable()->after('destination');
            }
            if (! Schema::hasColumn('tour_packages', 'discount_price')) {
                $table->decimal('discount_price', 12, 2)->nullable()->after('price');
            }
            if (! Schema::hasColumn('tour_packages', 'max_people')) {
                $table->unsignedInteger('max_people')->nullable()->after('duration');
            }
            if (! Schema::hasColumn('tour_packages', 'featured')) {
                $table->boolean('featured')->default(false)->after('status');
            }
            if (! Schema::hasColumn('tour_packages', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('featured')->constrained('users')->nullOnDelete();
            }
            $table->index('status');
            $table->index('featured');
            $table->index('created_by');
        });

        if (! Schema::hasTable('package_images')) {
            Schema::create('package_images', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tour_package_id')->constrained('tour_packages')->cascadeOnDelete();
                $table->string('image');
                $table->string('alt_text')->nullable();
                $table->string('title')->nullable();
                $table->boolean('is_featured')->default(false);
                $table->timestamps();

                $table->index(['tour_package_id', 'is_featured']);
            });
        }

        Schema::table('bookings', function (Blueprint $table): void {
            if (! Schema::hasColumn('bookings', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('bookings', 'package_id')) {
                $table->foreignId('package_id')->nullable()->after('tour_package_id')->constrained('tour_packages')->nullOnDelete();
            }
            if (! Schema::hasColumn('bookings', 'persons')) {
                $table->unsignedInteger('persons')->nullable()->after('travel_date');
            }
            $table->index('booking_status');
            $table->index('payment_status');
        });

        Schema::table('leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('leads', 'destination')) {
                $table->string('destination', 150)->nullable()->after('email');
            }
            $table->index('assigned_to');
            $table->index('status');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            if (! Schema::hasColumn('blog_posts', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            }
            $table->index('status');
            $table->index('created_by');
        });

        if (! Schema::hasColumn('seo_meta', 'seoable_id')) {
            Schema::table('seo_meta', function (Blueprint $table): void {
                $table->unsignedBigInteger('seoable_id')->nullable()->after('id');
                $table->string('seoable_type')->nullable()->after('seoable_id');
                $table->string('robots', 30)->nullable()->after('canonical_url');
                $table->json('schema_json')->nullable()->after('json_ld');
                $table->index(['seoable_type', 'seoable_id'], 'seo_meta_seoable_index');
            });
        }

        if (! Schema::hasTable('seo_social')) {
            Schema::create('seo_social', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('seo_meta_id')->constrained('seo_meta')->cascadeOnDelete();
                $table->string('og_title')->nullable();
                $table->text('og_description')->nullable();
                $table->string('og_image')->nullable();
                $table->string('og_url')->nullable();
                $table->string('twitter_title')->nullable();
                $table->text('twitter_description')->nullable();
                $table->string('twitter_image')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('global_seo_settings')) {
            Schema::create('global_seo_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('site_name');
                $table->string('default_meta_title')->nullable();
                $table->text('default_meta_description')->nullable();
                $table->longText('robots_txt')->nullable();
                $table->boolean('sitemap_auto')->default(true);
                $table->longText('google_analytics_code')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('activity_logs', function (Blueprint $table): void {
            if (! Schema::hasColumn('activity_logs', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('activity_logs', 'module')) {
                $table->string('module', 100)->nullable()->after('action');
            }
            $table->index('module');
        });

        Schema::table('reviews', function (Blueprint $table): void {
            if (! Schema::hasColumn('reviews', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('reviews', 'package_id')) {
                $table->foreignId('package_id')->nullable()->after('tour_package_id')->constrained('tour_packages')->nullOnDelete();
            }
            if (! Schema::hasColumn('reviews', 'status')) {
                $table->string('status', 20)->default('pending')->after('review');
            }
            $table->index('status');
        });

        if (! Schema::hasTable('pages')) {
            Schema::create('pages', function (Blueprint $table): void {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->longText('content')->nullable();
                $table->string('status', 20)->default('draft');
                $table->timestamps();

                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
        Schema::dropIfExists('global_seo_settings');
        Schema::dropIfExists('seo_social');
        Schema::dropIfExists('package_images');
    }
};

