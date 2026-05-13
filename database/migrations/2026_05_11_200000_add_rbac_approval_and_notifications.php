<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('remember_token');
            }
        });

        Schema::table('tour_packages', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_packages', 'approval_status')) {
                $table->string('approval_status', 20)->default('approved')->after('status');
            }
            if (! Schema::hasColumn('tour_packages', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('approval_status')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('tour_packages', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (! Schema::hasColumn('tour_packages', 'approval_remarks')) {
                $table->text('approval_remarks')->nullable()->after('approved_at');
            }
            $table->index('approval_status');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            if (! Schema::hasColumn('blog_posts', 'approval_status')) {
                $table->string('approval_status', 20)->default('approved')->after('status');
            }
            if (! Schema::hasColumn('blog_posts', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('approval_status')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('blog_posts', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (! Schema::hasColumn('blog_posts', 'approval_remarks')) {
                $table->text('approval_remarks')->nullable()->after('approved_at');
            }
            $table->index('approval_status');
        });

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }

        // Existing rows: treat as already approved for live site continuity
        if (Schema::hasColumn('tour_packages', 'approval_status')) {
            DB::table('tour_packages')->whereNull('approval_status')->update(['approval_status' => 'approved']);
        }
        if (Schema::hasColumn('blog_posts', 'approval_status')) {
            DB::table('blog_posts')->whereNull('approval_status')->update(['approval_status' => 'approved']);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('blog_posts', function (Blueprint $table): void {
            if (Schema::hasColumn('blog_posts', 'approval_remarks')) {
                $table->dropColumn('approval_remarks');
            }
            if (Schema::hasColumn('blog_posts', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('blog_posts', 'approved_by')) {
                $table->dropConstrainedForeignId('approved_by');
            }
            if (Schema::hasColumn('blog_posts', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
        });

        Schema::table('tour_packages', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_packages', 'approval_remarks')) {
                $table->dropColumn('approval_remarks');
            }
            if (Schema::hasColumn('tour_packages', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('tour_packages', 'approved_by')) {
                $table->dropConstrainedForeignId('approved_by');
            }
            if (Schema::hasColumn('tour_packages', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'last_login_at')) {
                $table->dropColumn('last_login_at');
            }
            if (Schema::hasColumn('users', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
