<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageVariantManager
{
    private const WIDTHS = [480, 768, 1200];

    public function storeWithVariants(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $path = $file->store($directory, $disk);
        $this->generateVariants($path, $disk);

        return $path;
    }

    public function deleteWithVariants(?string $path, string $disk = 'public'): void
    {
        if (! $path || str_starts_with($path, 'http')) {
            return;
        }

        $info = pathinfo($path);
        $dirname = ($info['dirname'] ?? '.') === '.' ? '' : ($info['dirname'] ?? '');
        $filename = $info['filename'] ?? '';
        $extension = strtolower($info['extension'] ?? '');

        $paths = [$path];
        foreach (self::WIDTHS as $width) {
            if ($extension !== '') {
                $paths[] = ltrim($dirname.'/'.$filename.'_'.$width.'.'.$extension, '/');
            }
            $paths[] = ltrim($dirname.'/'.$filename.'_'.$width.'.webp', '/');
        }

        Storage::disk($disk)->delete($paths);
    }

    public function generateForExisting(?string $path, string $disk = 'public'): void
    {
        if (! $path || str_starts_with($path, 'http')) {
            return;
        }

        $this->generateVariants($path, $disk);
    }

    private function generateVariants(string $path, string $disk): void
    {
        $fullPath = Storage::disk($disk)->path($path);
        if (! is_file($fullPath)) {
            return;
        }

        [$originalWidth, $originalHeight] = getimagesize($fullPath) ?: [0, 0];
        if ($originalWidth <= 0 || $originalHeight <= 0) {
            return;
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $sourceImage = $this->createSourceImage($fullPath, $extension);
        if (! $sourceImage) {
            return;
        }

        $info = pathinfo($path);
        $dirname = ($info['dirname'] ?? '.') === '.' ? '' : ($info['dirname'] ?? '');
        $filename = $info['filename'] ?? '';

        foreach (self::WIDTHS as $width) {
            if ($originalWidth <= $width) {
                continue;
            }

            $height = max(1, (int) round(($originalHeight / $originalWidth) * $width));
            $canvas = imagecreatetruecolor($width, $height);
            if (! $canvas) {
                continue;
            }

            if (in_array($extension, ['png', 'webp'], true)) {
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                imagefill($canvas, 0, 0, $transparent);
            }

            imagecopyresampled($canvas, $sourceImage, 0, 0, 0, 0, $width, $height, $originalWidth, $originalHeight);

            $resizedPath = ltrim($dirname.'/'.$filename.'_'.$width.'.'.$extension, '/');
            $targetPath = Storage::disk($disk)->path($resizedPath);
            $this->saveImageByExtension($canvas, $targetPath, $extension);

            if (function_exists('imagewebp')) {
                $webpPath = ltrim($dirname.'/'.$filename.'_'.$width.'.webp', '/');
                imagewebp($canvas, Storage::disk($disk)->path($webpPath), 82);
            }

            imagedestroy($canvas);
        }

        imagedestroy($sourceImage);
    }

    private function createSourceImage(string $path, string $extension): mixed
    {
        return match ($extension) {
            'jpg', 'jpeg' => function_exists('imagecreatefromjpeg') ? imagecreatefromjpeg($path) : null,
            'png' => function_exists('imagecreatefrompng') ? imagecreatefrompng($path) : null,
            'webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : null,
            default => null,
        };
    }

    private function saveImageByExtension(mixed $image, string $targetPath, string $extension): void
    {
        match ($extension) {
            'jpg', 'jpeg' => imagejpeg($image, $targetPath, 84),
            'png' => imagepng($image, $targetPath, 6),
            'webp' => imagewebp($image, $targetPath, 82),
            default => null,
        };
    }
}
