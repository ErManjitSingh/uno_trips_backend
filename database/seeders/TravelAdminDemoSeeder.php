<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\Booking;
use App\Models\GlobalSeoSetting;
use App\Models\Lead;
use App\Models\PackageImage;
use App\Models\Page;
use App\Models\Review;
use App\Models\SeoMeta;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Database\Seeder;

class TravelAdminDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'System Admin',
            'email' => 'admin@travel.local',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $vendor = User::factory()->create([
            'name' => 'Vendor Partner',
            'email' => 'vendor@travel.local',
            'role' => 'vendor',
            'status' => 'active',
        ]);

        $users = User::factory(5)->create(['role' => 'user', 'status' => 'active']);

        $packages = TourPackage::factory(8)->create(['created_by' => $vendor->id]);
        $packages->each(function (TourPackage $package) use ($users): void {
            PackageImage::factory(3)->create(['tour_package_id' => $package->id]);
            Booking::factory(2)->create([
                'tour_package_id' => $package->id,
                'package_id' => $package->id,
                'user_id' => $users->random()->id,
            ]);
            Review::factory(2)->create([
                'tour_package_id' => $package->id,
                'package_id' => $package->id,
                'user_id' => $users->random()->id,
            ]);

            $seo = SeoMeta::factory()->create([
                'seoable_type' => TourPackage::class,
                'seoable_id' => $package->id,
                'entity_type' => 'tour_package',
                'entity_id' => $package->id,
            ]);
            $seo->social()->create([
                'og_title' => $seo->meta_title,
                'og_description' => $seo->meta_description,
                'og_url' => url('/tours/'.$package->slug),
                'twitter_title' => $seo->meta_title,
                'twitter_description' => $seo->meta_description,
            ]);
        });

        BlogPost::factory(6)->create(['created_by' => $admin->id])->each(function (BlogPost $blog): void {
            $seo = SeoMeta::factory()->create([
                'seoable_type' => BlogPost::class,
                'seoable_id' => $blog->id,
                'entity_type' => 'blog_post',
                'entity_id' => $blog->id,
            ]);
            $seo->social()->create([
                'og_title' => $seo->meta_title,
                'og_description' => $seo->meta_description,
                'og_url' => url('/blog/'.$blog->slug),
                'twitter_title' => $seo->meta_title,
                'twitter_description' => $seo->meta_description,
            ]);
        });

        Page::factory()->create(['title' => 'Home', 'slug' => 'home', 'status' => 'published']);
        Page::factory()->create(['title' => 'About', 'slug' => 'about', 'status' => 'published']);
        Page::factory()->create(['title' => 'Contact', 'slug' => 'contact', 'status' => 'published']);

        Lead::factory(12)->create(['assigned_to' => $admin->id]);
        GlobalSeoSetting::factory()->create(['site_name' => 'UNO Trips']);
    }
}

