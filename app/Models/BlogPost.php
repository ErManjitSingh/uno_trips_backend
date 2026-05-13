<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Facades\Schema;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_category_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'status',
        'created_by',
        'published_at',
        'seo_meta_title',
        'seo_meta_description',
        'is_popular',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_popular' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(BlogComment::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tag');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(BlogCategory::class, 'blog_post_category');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePubliclyVisible($query)
    {
        $query->where('status', 'published');
        if (Schema::hasColumn((new BlogPost)->getTable(), 'approval_status')) {
            $query->where('approval_status', ApprovalStatus::Approved->value);
        }

        return $query;
    }

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'seoable');
    }
}
