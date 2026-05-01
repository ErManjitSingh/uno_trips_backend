<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'banner_image' => $this->banner_image,
            'banner_overlay_text' => $this->banner_overlay_text,
            'slug' => $this->slug,
            'page_type' => $this->page_type,
            'status' => $this->status,
            'publish_at' => $this->publish_at,
            'filters_json' => $this->filters_json,
            'created_at' => $this->created_at,
        ];
    }
}
