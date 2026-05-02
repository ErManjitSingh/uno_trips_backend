<?php

namespace App\Services;

use App\Models\BlogComment;
use App\Models\BlogPost;
use App\Models\Destination;
use App\Models\Lead;
use App\Models\ListingPage;
use App\Models\MediaAsset;
use App\Models\Review;
use App\Models\SeoMeta;
use App\Models\Testimonial;
use App\Models\TourPackage;
use App\Models\WebsiteSetting;
use Illuminate\Support\Facades\Schema;

class AdminIntelligenceService
{
    public function fullReport(): array
    {
        $packages = $this->analyzePackages();
        $blogs = $this->analyzeBlogs();
        $destinations = $this->analyzeDestinations();
        $listingPages = $this->analyzeListingPages();
        $seo = $this->analyzeSeo();
        $settings = $this->analyzeSettings();
        $reviews = $this->analyzeReviews();
        $testimonials = $this->analyzeTestimonials();
        $leads = $this->analyzeLeads();
        $media = $this->analyzeMedia();
        $comments = $this->analyzeComments();

        $sections = [
            'packages' => $packages,
            'blogs' => $blogs,
            'destinations' => $destinations,
            'listing_pages' => $listingPages,
            'seo' => $seo,
            'settings' => $settings,
            'reviews' => $reviews,
            'testimonials' => $testimonials,
            'leads' => $leads,
            'media' => $media,
            'comments' => $comments,
        ];

        $readiness = $this->computeReadiness($sections);
        $recommendations = $this->buildRecommendations($sections);
        $alerts = $this->buildAlerts($sections);

        return [
            'generated_at' => now()->toIso8601String(),
            'sections' => $sections,
            'readiness' => $readiness,
            'recommendations' => $recommendations,
            'alerts' => $alerts,
        ];
    }

    public function adminStatusSnapshot(array $report): array
    {
        $r = $report['readiness'];
        $s = $report['sections'];

        return [
            'generated_at' => $report['generated_at'],
            'readiness_percent' => $r['percent'],
            'readiness_label' => $r['label'],
            'cards' => [
                [
                    'key' => 'packages',
                    'title' => 'Packages',
                    'status' => $s['packages']['warnings'] > 0 ? 'warning' : ($s['packages']['drafts'] + $s['packages']['published_incomplete'] > 0 ? 'pending' : 'ok'),
                    'completed' => $s['packages']['published_complete'],
                    'pending' => $s['packages']['drafts'] + $s['packages']['published_incomplete'],
                    'hint' => $s['packages']['published_incomplete'].' published need attention',
                ],
                [
                    'key' => 'blogs',
                    'title' => 'Blogs',
                    'status' => $s['blogs']['seo_gaps'] > 0 ? 'warning' : 'ok',
                    'completed' => $s['blogs']['published_with_seo'],
                    'pending' => $s['blogs']['drafts'] + $s['blogs']['published_missing_seo'],
                    'hint' => $s['blogs']['drafts'].' drafts',
                ],
                [
                    'key' => 'seo',
                    'title' => 'SEO Health',
                    'status' => $s['seo']['weak_entries'] > 5 ? 'warning' : 'ok',
                    'completed' => max(0, $s['seo']['total_entries'] - $s['seo']['weak_entries']),
                    'pending' => $s['seo']['weak_entries'],
                    'hint' => $s['seo']['weak_entries'].' entries need meta polish',
                ],
                [
                    'key' => 'missing',
                    'title' => 'Missing data',
                    'status' => $r['percent'] < 70 ? 'warning' : 'ok',
                    'completed' => null,
                    'pending' => $s['packages']['missing_featured_image'] + $s['packages']['missing_itinerary'] + $s['blogs']['published_missing_seo'],
                    'hint' => 'Images, itinerary, meta',
                ],
                [
                    'key' => 'reviews',
                    'title' => 'Reviews',
                    'status' => $s['reviews']['pending_approval'] > 0 ? 'pending' : 'ok',
                    'completed' => $s['reviews']['approved'],
                    'pending' => $s['reviews']['pending_approval'],
                    'hint' => 'Awaiting moderation',
                ],
                [
                    'key' => 'settings',
                    'title' => 'Settings',
                    'status' => $s['settings']['issues'] > 0 ? 'warning' : 'ok',
                    'completed' => null,
                    'pending' => $s['settings']['issues'],
                    'hint' => $s['settings']['summary'],
                ],
            ],
            'alerts' => array_slice($report['alerts'], 0, 10),
        ];
    }

    private function analyzePackages(): array
    {
        $total = TourPackage::query()->count();
        $drafts = TourPackage::query()->where('status', 'draft')->count();
        $published = TourPackage::query()->where('status', 'published')->count();

        $missingImage = TourPackage::query()->where('status', 'published')
            ->where(function ($q): void {
                $q->whereNull('featured_image')->orWhere('featured_image', '');
            })->count();

        $missingItinerary = TourPackage::query()->where('status', 'published')
            ->where(function ($q): void {
                $q->whereNull('itinerary')
                    ->orWhere('itinerary', '[]')
                    ->orWhere('itinerary', 'null');
            })->count();

        $missingSeo = TourPackage::query()->where('status', 'published')
            ->where(function ($q): void {
                $q->whereNull('seo_meta_title')->orWhere('seo_meta_title', '')
                    ->orWhereNull('seo_meta_description')->orWhere('seo_meta_description', '');
            })->count();

        $missingShort = TourPackage::query()->where('status', 'published')
            ->where(function ($q): void {
                $q->whereNull('short_description')->orWhere('short_description', '');
            })->count();

        $publishedIncomplete = TourPackage::query()->where('status', 'published')->get()
            ->filter(function (TourPackage $p): bool {
                $img = empty($p->featured_image);
                $it = $this->itineraryIsEmpty($p);
                $seo = empty($p->seo_meta_title) || empty($p->seo_meta_description);
                $short = empty($p->short_description);

                return $img || $it || $seo || $short;
            })->count();

        $publishedComplete = max(0, $published - $publishedIncomplete);

        return [
            'total' => $total,
            'drafts' => $drafts,
            'published' => $published,
            'published_complete' => $publishedComplete,
            'published_incomplete' => $publishedIncomplete,
            'missing_featured_image' => $missingImage,
            'missing_itinerary' => $missingItinerary,
            'missing_seo' => $missingSeo,
            'missing_short_description' => $missingShort,
            'warnings' => $missingImage + $missingItinerary,
            'pending' => $drafts,
        ];
    }

    private function itineraryIsEmpty(TourPackage $p): bool
    {
        $it = $p->itinerary;
        if ($it === null) {
            return true;
        }
        if (is_array($it)) {
            return count($it) === 0;
        }

        return true;
    }

    private function analyzeBlogs(): array
    {
        $total = BlogPost::query()->count();
        $drafts = BlogPost::query()->where('status', 'draft')->count();
        $published = BlogPost::query()->where('status', 'published')->count();
        $missingSeo = BlogPost::query()->where('status', 'published')
            ->where(function ($q): void {
                $q->whereNull('seo_meta_title')->orWhere('seo_meta_title', '')
                    ->orWhereNull('seo_meta_description')->orWhere('seo_meta_description', '');
            })->count();

        $publishedWithSeo = max(0, $published - $missingSeo);

        return [
            'total' => $total,
            'drafts' => $drafts,
            'published' => $published,
            'published_with_seo' => $publishedWithSeo,
            'published_missing_seo' => $missingSeo,
            'seo_gaps' => $missingSeo,
        ];
    }

    private function analyzeDestinations(): array
    {
        if (! Schema::hasTable('destinations')) {
            return ['total' => 0, 'incomplete' => 0, 'missing_hero' => 0, 'missing_seo' => 0];
        }

        $missingHero = Destination::query()->where(function ($q): void {
            $q->whereNull('hero_image')->orWhere('hero_image', '');
        })->count();
        $missingSeo = Destination::query()->where(function ($q): void {
            $q->whereNull('seo_meta_title')->orWhere('seo_meta_title', '')
                ->orWhereNull('seo_meta_description')->orWhere('seo_meta_description', '');
        })->count();

        return [
            'total' => Destination::query()->count(),
            'incomplete' => $missingHero + $missingSeo,
            'missing_hero' => $missingHero,
            'missing_seo' => $missingSeo,
        ];
    }

    private function analyzeListingPages(): array
    {
        if (! Schema::hasTable('listing_pages')) {
            return ['total' => 0, 'inactive' => 0, 'missing_banner' => 0, 'missing_meta' => 0];
        }

        $inactive = ListingPage::query()->where('status', '!=', 'active')->count();
        $missingBanner = ListingPage::query()->where(function ($q): void {
            $q->whereNull('banner_image')->orWhere('banner_image', '');
        })->count();
        $missingMeta = ListingPage::query()->where(function ($q): void {
            $q->whereNull('meta_title')->orWhere('meta_title', '')
                ->orWhereNull('meta_description')->orWhere('meta_description', '');
        })->count();

        return [
            'total' => ListingPage::query()->count(),
            'inactive' => $inactive,
            'missing_banner' => $missingBanner,
            'missing_meta' => $missingMeta,
        ];
    }

    private function analyzeSeo(): array
    {
        if (! Schema::hasTable('seo_meta')) {
            return ['total_entries' => 0, 'weak_entries' => 0];
        }

        $weak = SeoMeta::query()->where(function ($q): void {
            $q->whereNull('meta_description')->orWhere('meta_description', '')
                ->orWhereRaw('LENGTH(meta_description) < 70');
        })->count();

        return [
            'total_entries' => SeoMeta::query()->count(),
            'weak_entries' => $weak,
        ];
    }

    private function analyzeSettings(): array
    {
        $w = WebsiteSetting::query()->first();
        $issues = 0;
        $lines = [];
        if (! $w) {
            return ['issues' => 1, 'summary' => 'No settings row', 'lines' => ['Create website settings']];
        }
        if (empty($w->site_name)) {
            $issues++;
            $lines[] = 'Site name missing';
        }
        if (empty($w->logo)) {
            $issues++;
            $lines[] = 'Logo not uploaded';
        }
        if (empty($w->support_email) && empty($w->contact_email)) {
            $issues++;
            $lines[] = 'Contact email missing';
        }
        $smtp = $w->smtp_settings ?? [];
        if (empty($smtp['host']) || empty($smtp['username'])) {
            $issues++;
            $lines[] = 'SMTP not fully configured';
        }

        return [
            'issues' => $issues,
            'summary' => $issues === 0 ? 'Core settings OK' : implode(', ', $lines),
            'lines' => $lines,
        ];
    }

    private function analyzeReviews(): array
    {
        if (! Schema::hasTable('reviews')) {
            return ['approved' => 0, 'pending_approval' => 0];
        }

        $pending = Review::query()->where('is_approved', false)->count();
        $approved = Review::query()->where('is_approved', true)->count();

        return [
            'approved' => $approved,
            'pending_approval' => $pending,
        ];
    }

    private function analyzeTestimonials(): array
    {
        if (! Schema::hasTable('testimonials')) {
            return ['total' => 0, 'approved' => 0, 'inactive' => 0];
        }

        $approved = Testimonial::query()->where('is_approved', true)->count();
        $total = Testimonial::query()->count();

        return [
            'total' => $total,
            'approved' => $approved,
            'inactive' => max(0, $total - $approved),
        ];
    }

    private function analyzeLeads(): array
    {
        if (! Schema::hasTable('leads')) {
            return ['new_leads' => 0, 'total' => 0];
        }

        return [
            'new_leads' => Lead::query()->where('status', 'new')->count(),
            'total' => Lead::query()->count(),
        ];
    }

    private function analyzeMedia(): array
    {
        if (! Schema::hasTable('media_assets')) {
            return ['total' => 0];
        }

        return ['total' => MediaAsset::query()->count()];
    }

    private function analyzeComments(): array
    {
        if (! Schema::hasTable('blog_comments')) {
            return ['pending' => 0];
        }

        return [
            'pending' => BlogComment::query()->where('is_approved', false)->count(),
        ];
    }

    /** @param  array<string, array<string, mixed>>  $sections */
    private function computeReadiness(array $sections): array
    {
        $p = $sections['packages'];
        $b = $sections['blogs'];
        $d = $sections['destinations'];
        $l = $sections['listing_pages'];
        $seo = $sections['seo'];
        $st = $sections['settings'];
        $r = $sections['reviews'];
        $t = $sections['testimonials'];
        $leads = $sections['leads'];
        $media = $sections['media'];
        $c = $sections['comments'];

        $penalty = 0;
        $penalty += min(18, $p['published_incomplete'] * 3);
        $penalty += min(12, $p['drafts']);
        $penalty += min(12, $b['published_missing_seo'] * 2 + $b['drafts']);
        $penalty += min(8, $d['incomplete'] * 2);
        $penalty += min(8, $l['missing_banner'] + $l['missing_meta']);
        $penalty += min(10, (int) floor($seo['weak_entries'] / 2));
        $penalty += min(8, $st['issues'] * 2);
        $penalty += min(6, $r['pending_approval']);
        $penalty += $t['total'] > 0 && $t['approved'] === 0 ? 6 : 0;
        $penalty += min(4, $c['pending']);
        $penalty += min(4, $leads['new_leads']);
        $penalty += $media['total'] < 3 ? 3 : 0;

        $percent = (int) round(max(5, min(100, 100 - $penalty)));
        $label = match (true) {
            $percent >= 95 => 'Launch ready',
            $percent >= 80 => 'Strong',
            $percent >= 60 => 'Good progress',
            $percent >= 40 => 'Needs work',
            default => 'Early stage',
        };

        return [
            'percent' => $percent,
            'label' => $label,
            'penalty_estimate' => $penalty,
        ];
    }

    /** @param  array<string, array<string, mixed>>  $sections */
    private function buildRecommendations(array $sections): array
    {
        $p = $sections['packages'];
        $b = $sections['blogs'];
        $d = $sections['destinations'];
        $l = $sections['listing_pages'];
        $seo = $sections['seo'];
        $st = $sections['settings'];
        $r = $sections['reviews'];
        $t = $sections['testimonials'];
        $leads = $sections['leads'];
        $media = $sections['media'];

        $out = [];
        if ($p['missing_featured_image'] > 0) {
            $out[] = 'Upload featured images for '.$p['missing_featured_image'].' published package(s).';
        }
        if ($p['missing_itinerary'] > 0) {
            $out[] = 'Complete itinerary for '.$p['missing_itinerary'].' package(s) — travellers need day-by-day clarity.';
        }
        if ($b['published_missing_seo'] > 0) {
            $out[] = 'Add meta titles & descriptions to '.$b['published_missing_seo'].' published blog post(s).';
        }
        if ($d['missing_hero'] > 0) {
            $out[] = 'Add hero images to '.$d['missing_hero'].' destination page(s).';
        }
        if ($l['missing_meta'] > 0) {
            $out[] = 'Improve listing page SEO — '.$l['missing_meta'].' page(s) lack meta title/description.';
        }
        if ($seo['weak_entries'] > 0) {
            $out[] = 'Strengthen '.$seo['weak_entries'].' SEO meta entries (aim for 70–160 char descriptions).';
        }
        if ($r['pending_approval'] > 0) {
            $out[] = 'Moderate '.$r['pending_approval'].' review(s) awaiting approval.';
        }
        if ($st['issues'] > 0) {
            $out[] = 'Finish core website settings: '.$st['summary'];
        }
        if ($media['total'] < 5) {
            $out[] = 'Grow media library — only '.$media['total'].' asset(s) uploaded.';
        }
        if ($leads['new_leads'] > 0) {
            $out[] = $leads['new_leads'].' new lead(s) — assign or update status in Leads.';
        }
        if (count($out) === 0) {
            $out[] = 'System looks healthy — keep publishing fresh packages and blogs.';
        }

        return $out;
    }

    /** @param  array<string, array<string, mixed>>  $sections */
    private function buildAlerts(array $sections): array
    {
        $alerts = [];
        $p = $sections['packages'];
        if ($p['drafts'] > 0) {
            $alerts[] = $p['drafts'].' package draft(s) unpublished.';
        }
        if ($p['published_incomplete'] > 0) {
            $alerts[] = $p['published_incomplete'].' published package(s) need content or SEO fixes.';
        }
        $b = $sections['blogs'];
        if ($b['published_missing_seo'] > 0) {
            $alerts[] = 'Blog SEO: '.$b['published_missing_seo'].' published post(s) missing meta.';
        }
        $r = $sections['reviews'];
        if ($r['pending_approval'] > 0) {
            $alerts[] = $r['pending_approval'].' review(s) pending moderation.';
        }
        $c = $sections['comments'];
        if ($c['pending'] > 0) {
            $alerts[] = $c['pending'].' blog comment(s) awaiting approval.';
        }

        return $alerts;
    }

    /** @param  array<string, mixed>  $report */
    public function answerChat(string $message, array $report): array
    {
        $m = mb_strtolower(trim($message));
        $s = $report['sections'];
        $read = $report['readiness'];
        $rec = $report['recommendations'];

        $suggestions = [
            'What is pending?',
            'Is everything ready for launch?',
            'Show dashboard status',
            'How do I add a package?',
        ];

        if ($m === '' || $m === 'hi' || $m === 'hello' || str_contains($m, 'help')) {
            return [
                'reply' => "I'm your **Admin Intelligence** monitor. I track packages, blogs, SEO, reviews, leads, and settings — not content generation.\n\nTry: **What is pending?**, **Launch readiness?**, or **Run system audit** from the quick actions.",
                'suggestions' => $suggestions,
            ];
        }

        if (str_contains($m, 'pending')) {
            $lines = [];
            $lines[] = '• **Packages:** '.$s['packages']['drafts'].' drafts; '.$s['packages']['published_incomplete'].' published need fixes (image/itinerary/SEO/short text).';
            $lines[] = '• **Blogs:** '.$s['blogs']['drafts'].' drafts; '.$s['blogs']['published_missing_seo'].' published missing SEO meta.';
            $lines[] = '• **Destinations:** '.$s['destinations']['incomplete'].' incomplete (hero/SEO).';
            $lines[] = '• **Listing pages:** '.$s['listing_pages']['inactive'].' not active; '.$s['listing_pages']['missing_banner'].' missing banner.';
            $lines[] = '• **Reviews:** '.$s['reviews']['pending_approval'].' awaiting approval.';
            $lines[] = '• **Testimonials:** '.$s['testimonials']['approved'].' active; '.$s['testimonials']['inactive'].' not yet approved or inactive.';
            $lines[] = '• **Comments:** '.$s['comments']['pending'].' blog comments pending.';
            $lines[] = '• **Leads:** '.$s['leads']['new_leads'].' new status.';

            return ['reply' => implode("\n", $lines), 'suggestions' => $suggestions];
        }

        if (str_contains($m, 'launch') || str_contains($m, 'ready')) {
            $lines = [];
            $lines[] = '**Website readiness: '.$read['percent'].'%** — '.$read['label'].'.';
            $lines[] = '';
            $lines[] = '**Top gaps:**';
            foreach (array_slice($rec, 0, 6) as $line) {
                $lines[] = '• '.$line;
            }

            return ['reply' => implode("\n", $lines), 'suggestions' => $suggestions];
        }

        if (str_contains($m, 'dashboard') || str_contains($m, 'status') || str_contains($m, 'summary')) {
            return [
                'reply' => '**Snapshot**'."\n"
                    .'• Readiness: **'.$read['percent'].'%**'."\n"
                    .'• Packages: '.$s['packages']['published'].' published / '.$s['packages']['total'].' total'."\n"
                    .'• Blogs: '.$s['blogs']['published'].' published'."\n"
                    .'• SEO entries: '.$s['seo']['total_entries'].' (weak: '.$s['seo']['weak_entries'].')'."\n"
                    .'• Media assets: '.$s['media']['total']."\n"
                    .'• Open alerts: '.count($report['alerts']),
                'cards' => [
                    ['title' => 'Readiness', 'value' => (string) $read['percent'].'%', 'tone' => 'emerald'],
                    ['title' => 'Attention', 'value' => (string) ($s['packages']['warnings'] + $s['reviews']['pending_approval']), 'tone' => 'amber'],
                    ['title' => 'SEO gaps', 'value' => (string) $s['seo']['weak_entries'], 'tone' => 'violet'],
                ],
                'suggestions' => $suggestions,
            ];
        }

        if (str_contains($m, 'how') && (str_contains($m, 'package') || str_contains($m, 'tour'))) {
            return [
                'reply' => "**Add a package:**\n1. Go to **Package Control → Add New Package** (`/admin/packages?tab=add`).\n2. Fill title, slug, destination, duration, pricing.\n3. Upload **featured image** and **itinerary** days.\n4. Set **SEO meta** title & description.\n5. Switch status to **Published** when ready.\n\nI'll flag missing fields automatically in audits.",
                'suggestions' => $suggestions,
            ];
        }

        if (str_contains($m, 'how') && str_contains($m, 'destination')) {
            return [
                'reply' => "**Publish a destination:**\n1. Open **Package Control → Destinations** (`/admin/destinations`).\n2. Create or edit: name, slug, hero image, and page content.\n3. Set **SEO meta** title & description.\n4. Save — link the destination from packages or menus so visitors can reach it.\n\nCurrently **".$s['destinations']['incomplete'].'** row(s) need hero image or SEO.',
                'suggestions' => $suggestions,
            ];
        }

        if (str_contains($m, 'destination')) {
            return [
                'reply' => "**Destinations:** incomplete count **".$s['destinations']['incomplete']."** (missing hero image or SEO). Add hero + meta for each destination you promote.",
                'suggestions' => $suggestions,
            ];
        }

        if (str_contains($m, 'audit')) {
            return [
                'reply' => 'Use **Run system audit** in this panel (or GET `/api/system-audit`) for the full JSON report. Readiness: **'.$read['percent'].'%** with '.count($rec).' recommendation line(s).',
                'suggestions' => $suggestions,
            ];
        }

        return [
            'reply' => "I focus on **status, gaps, and next steps** across your admin modules. Current readiness: **{$read['percent']}%**.\n\nAsk about **pending work**, **launch readiness**, or **how-to** for a section.",
            'suggestions' => $suggestions,
        ];
    }
}
