<?php

namespace App\Support;

final class ImageUploadRules
{
    public static function maxKilobytes(): int
    {
        return max(1, (int) config('filesystems.max_upload_image_kb', 500));
    }

    /** Laravel `max` rule for uploaded files (value is kilobytes). */
    public static function maxFileRule(): string
    {
        return 'max:'.self::maxKilobytes();
    }
}
