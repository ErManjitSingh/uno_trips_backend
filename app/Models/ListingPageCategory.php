<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ListingPageCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function listingPages(): HasMany
    {
        return $this->hasMany(ListingPage::class);
    }
}
