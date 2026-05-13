<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\Faq;
use App\Models\Lead;
use App\Models\Review;
use App\Models\Role;
use App\Models\Testimonial;
use App\Models\TourPackage;
use App\Models\WebsiteSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'manjitsingh012345@gmail.com')],
            [
                'name' => env('ADMIN_NAME', 'Admin User'),
                'password' => env('ADMIN_PASSWORD', 'Anku_123!'),
                'email_verified_at' => now(),
                'role' => 'super_admin',
                'status' => 'active',
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'executive@unotrips.com'],
            [
                'name' => 'Demo Executive',
                'password' => 'Executive_123!',
                'email_verified_at' => now(),
                'role' => 'executive',
                'status' => 'active',
                'phone' => null,
            ]
        );

        Role::query()->updateOrCreate(['name' => 'super_admin'], ['permissions' => ['*']]);
        Role::query()->updateOrCreate(['name' => 'sales'], ['permissions' => ['leads.view', 'leads.update', 'bookings.view']]);
        Role::query()->updateOrCreate(['name' => 'content_manager'], ['permissions' => ['packages.manage', 'blogs.manage']]);

        $customer = Customer::query()->updateOrCreate(
            ['email' => 'aman@mail.com'],
            ['full_name' => 'Aman Sharma', 'phone' => '9876500000']
        );

        $package = TourPackage::query()->updateOrCreate(
            ['slug' => 'triund-trek-premium'],
            [
                'title' => 'Triund Trek Premium',
                'destination' => 'Himachal Pradesh',
                'duration' => '3D / 2N',
                'price' => 14999,
                'offer_price' => 12999,
                'package_type' => 'adventure',
                'status' => 'published',
                'is_popular' => true,
            ]
        );

        Destination::query()->updateOrCreate(
            ['slug' => 'himachal'],
            [
                'name' => 'Himachal',
                'state' => 'Himachal Pradesh',
                'short_description' => 'Snow peaks, alpine valleys, and luxury mountain stays.',
                'description' => 'Himachal offers a rich mix of adventure and relaxation for premium travelers.',
                'is_featured' => true,
            ]
        );

        Faq::query()->updateOrCreate(
            ['tour_package_id' => $package->id, 'question' => 'Is airport transfer included?'],
            ['answer' => 'Yes, pickup and drop are included in premium plans.', 'sort_order' => 1]
        );

        Review::query()->updateOrCreate(
            ['tour_package_id' => $package->id, 'name' => 'Ritika Arora'],
            ['rating' => 5, 'review' => 'Excellent planning, premium stays, and smooth coordination.', 'is_approved' => true]
        );

        Booking::query()->updateOrCreate(
            ['customer_id' => $customer->id, 'tour_package_id' => $package->id],
            [
                'customer' => $customer->full_name,
                'email' => $customer->email,
                'package_name' => $package->title,
                'booking_date' => now()->toDateString(),
                'travel_date' => now()->addDays(15)->toDateString(),
                'guests' => 2,
                'traveler_count' => 2,
                'amount' => 25998,
                'total_amount' => 25998,
                'booking_status' => 'Confirmed',
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]
        );

        Lead::query()->updateOrCreate(
            ['email' => 'priya@mail.com'],
            [
                'name' => 'Priya Mehta',
                'phone' => '9876543210',
                'message' => 'Need details for weekend trek package.',
                'source' => 'website',
                'status' => 'new',
            ]
        );

        Lead::query()->updateOrCreate(
            ['email' => 'rohit@mail.com'],
            [
                'name' => 'Rohit Jain',
                'phone' => '9988776655',
                'message' => 'Looking for family tour options.',
                'source' => 'ads',
                'status' => 'contacted',
            ]
        );

        $category = BlogCategory::query()->updateOrCreate(
            ['slug' => 'travel-guides'],
            ['name' => 'Travel Guides']
        );

        BlogPost::query()->updateOrCreate(
            ['slug' => 'best-time-to-visit-kasol'],
            [
                'blog_category_id' => $category->id,
                'title' => 'Best Time to Visit Kasol',
                'excerpt' => 'A practical month-by-month guide for Kasol travelers.',
                'content' => 'Kasol is best visited from March to June and October to November.',
                'status' => 'published',
                'published_at' => now(),
            ]
        );

        WebsiteSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'site_name' => config('app.name'),
                'contact_email' => 'hello@unotrips.example',
                'contact_phone' => '9999912345',
            ]
        );

        Testimonial::query()->updateOrCreate(
            ['customer_name' => 'Karan Malhotra'],
            ['rating' => 5, 'content' => 'Top-tier luxury tour planning from start to finish.', 'is_approved' => true]
        );

        $this->call(TravelAdminDemoSeeder::class);
    }
}
