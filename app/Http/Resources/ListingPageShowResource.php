<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPageShowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'page' => [
                'id' => $this->id,
                'title' => $this->title,
                'banner_image' => $this->banner_image,
                'banner_overlay_text' => $this->banner_overlay_text,
                'slug' => $this->slug,
                'page_type' => $this->page_type,
                'filters_json' => $this->filters_json,
                'packages_json' => $this->packages_json,
                'filter_controls_json' => $this->filter_controls_json,
                'content' => $this->content,
                'read_more' => $this->read_more,
                'tags' => $this->tags,
                'internal_links_json' => $this->internal_links_json,
                'status' => $this->status,
            ],
            'seo' => [
                'meta_title' => $this->meta_title,
                'meta_description' => $this->meta_description,
                'meta_keywords' => $this->meta_keywords,
                'canonical_url' => $this->canonical_url,
                'schema_json' => $this->schema_json,
                'seo_meta' => $this->seo_meta,
            ],
            'packages' => $this->resource->packages ?? null,
            'blogs' => $this->resource->related_blogs ?? [],
        ];
    }
}
