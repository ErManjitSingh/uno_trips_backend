<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageVariantManager
{
    private const WIDTHS = [480, 768, 1200];

    /** Longest edge cap before encoding (reduces huge camera uploads). */
    private const MAX_EDGE_PIXELS = 2560;

    private const WEBP_QUALITY = 80;

    private const JPEG_QUALITY = 82;

    public function storeWithVariants(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $path = $file->store($directory, $disk);
        $path = $this->convertPrimaryToWebpAndDownscale($path, $disk);
        $this->generateVariants($path, $disk);

        return $path;
    }

    /**
     * After a plain $file->store(...), run this to WebP + compress (no responsive variants).
     */
    public function optimizeStoredPath(string $path, string $disk = 'public'): string
    {
        return $this->convertPrimaryToWebpAndDownscale($path, $disk);
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

    /**
     * Raster images → WebP (agar GD mein imagewebp ho), warna same format par re-compress.
     * GIF skip (animation).
     */
    private function convertPrimaryToWebpAndDownscale(string $path, string $disk): string
    {
        $fullPath = Storage::disk($disk)->path($path);
        if (! is_file($fullPath)) {
            return $path;
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        if ($extension === 'gif') {
            return $path;
        }
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            return $path;
        }

        $sourceImage = $this->createSourceImage($fullPath, $extension);
        if (! $sourceImage) {
            return $path;
        }

        [$w, $h] = getimagesize($fullPath) ?: [0, 0];
        if ($w <= 0 || $h <= 0) {
            imagedestroy($sourceImage);

            return $path;
        }

        $working = $sourceImage;
        if ($w > self::MAX_EDGE_PIXELS || $h > self::MAX_EDGE_PIXELS) {
            if ($w >= $h) {
                $nw = self::MAX_EDGE_PIXELS;
                $nh = max(1, (int) round($h * (self::MAX_EDGE_PIXELS / $w)));
            } else {
                $nh = self::MAX_EDGE_PIXELS;
                $nw = max(1, (int) round($w * (self::MAX_EDGE_PIXELS / $h)));
            }
            $canvas = imagecreatetruecolor($nw, $nh);
            if (! $canvas) {
                imagedestroy($sourceImage);

                return $path;
            }
            if (in_array($extension, ['png', 'webp'], true)) {
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                imagefill($canvas, 0, 0, $transparent);
            }
            imagecopyresampled($canvas, $sourceImage, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($sourceImage);
            $working = $canvas;
        }

        $info = pathinfo($path);
        $dirname = ($info['dirname'] ?? '.') === '.' ? '' : ($info['dirname'] ?? '');
        $filename = $info['filename'] ?? '';
        $newRelPath = ltrim($dirname.'/'.$filename.'.webp', '/');

        if (function_exists('imagewebp')) {
            imagealphablending($working, false);
            imagesavealpha($working, true);
            $webpTarget = Storage::disk($disk)->path($newRelPath);
            imagewebp($working, $webpTarget, self::WEBP_QUALITY);
            imagedestroy($working);
            if ($newRelPath !== $path) {
                Storage::disk($disk)->delete($path);
            }

            return $newRelPath;
        }

        $this->saveImageByExtension($working, $fullPath, $extension === 'jpeg' ? 'jpg' : $extension);
        imagedestroy($working);

        return $path;
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
                imagewebp($canvas, Storage::disk($disk)->path($webpPath), self::WEBP_QUALITY);
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
            'jpg', 'jpeg' => imagejpeg($image, $targetPath, self::JPEG_QUALITY),
            'png' => imagepng($image, $targetPath, 6),
            'webp' => function_exists('imagewebp') ? imagewebp($image, $targetPath, self::WEBP_QUALITY) : null,
            default => null,
        };
    }
}
