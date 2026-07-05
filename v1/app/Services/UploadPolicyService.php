<?php

namespace App\Services;

use Efixmate\Domain\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

/** Direct port of server/src/services/uploadPolicy.service.js. */
class UploadPolicyService
{
    private const SETTING_KEY = 'upload_policy';
    private const CACHE_TTL_SECONDS = 30;
    private const MAX_LIMIT_MB = 10;
    private const MIN_TARGET_MB = 0.1;

    private const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp', 'tiff'];
    private const DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'webp'];
    private const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];

    public static function defaultPolicy(): array
    {
        return [
            'images' => ['enabled' => true, 'maxUploadMb' => 10, 'targetMb' => 1, 'outputFormat' => 'webp', 'acceptedFormats' => self::IMAGE_FORMATS],
            'documents' => ['enabled' => true, 'maxUploadMb' => 10, 'targetMb' => 1, 'acceptedFormats' => ['pdf', 'jpg', 'jpeg', 'png', 'webp']],
            'videos' => ['maxUploadMb' => 10, 'acceptedFormats' => self::VIDEO_FORMATS],
        ];
    }

    private static function clamp(mixed $value, float $fallback, float $min, float $max): float
    {
        $n = is_numeric($value) ? (float) $value : null;
        if ($n === null) return $fallback;

        return min($max, max($min, $n));
    }

    private static function normalizeFormats(mixed $value, array $allowed, array $fallback): array
    {
        $input = is_array($value) ? $value : $fallback;
        $out = collect($input)
            ->map(fn ($v) => ltrim(strtolower(trim((string) $v)), '.'))
            ->filter(fn ($v) => in_array($v, $allowed, true))
            ->unique()
            ->values()
            ->all();

        return $out ?: $fallback;
    }

    public static function normalize(array $policy = []): array
    {
        $defaults = self::defaultPolicy();

        return [
            'images' => [
                'enabled' => ($policy['images']['enabled'] ?? true) !== false,
                'maxUploadMb' => self::clamp($policy['images']['maxUploadMb'] ?? null, $defaults['images']['maxUploadMb'], 0.1, self::MAX_LIMIT_MB),
                'targetMb' => self::clamp($policy['images']['targetMb'] ?? null, $defaults['images']['targetMb'], self::MIN_TARGET_MB, self::MAX_LIMIT_MB),
                'outputFormat' => 'webp',
                'acceptedFormats' => self::normalizeFormats($policy['images']['acceptedFormats'] ?? null, self::IMAGE_FORMATS, $defaults['images']['acceptedFormats']),
            ],
            'documents' => [
                'enabled' => ($policy['documents']['enabled'] ?? true) !== false,
                'maxUploadMb' => self::clamp($policy['documents']['maxUploadMb'] ?? null, $defaults['documents']['maxUploadMb'], 0.1, self::MAX_LIMIT_MB),
                'targetMb' => self::clamp($policy['documents']['targetMb'] ?? null, $defaults['documents']['targetMb'], self::MIN_TARGET_MB, self::MAX_LIMIT_MB),
                'acceptedFormats' => self::normalizeFormats($policy['documents']['acceptedFormats'] ?? null, self::DOCUMENT_FORMATS, $defaults['documents']['acceptedFormats']),
            ],
            'videos' => [
                'maxUploadMb' => self::clamp($policy['videos']['maxUploadMb'] ?? null, $defaults['videos']['maxUploadMb'], 0.1, self::MAX_LIMIT_MB),
                'acceptedFormats' => self::normalizeFormats($policy['videos']['acceptedFormats'] ?? null, self::VIDEO_FORMATS, $defaults['videos']['acceptedFormats']),
            ],
        ];
    }

    public static function mbToBytes(float $mb): int
    {
        return (int) round($mb * 1024 * 1024);
    }

    public function get(bool $force = false): array
    {
        if ($force) Cache::forget('upload_policy');

        return Cache::remember('upload_policy', self::CACHE_TTL_SECONDS, function () {
            try {
                $value = SystemSetting::find(self::SETTING_KEY)?->setting_value ?? [];

                return self::normalize($value);
            } catch (\Throwable) {
                return self::defaultPolicy();
            }
        });
    }

    public function save(array $policy, ?string $actorId = null): array
    {
        $normalized = self::normalize($policy);

        SystemSetting::updateOrCreate(
            ['setting_key' => self::SETTING_KEY],
            ['setting_value' => $normalized, 'updated_by' => $actorId, 'updated_at' => now()],
        );

        Cache::put('upload_policy', $normalized, self::CACHE_TTL_SECONDS);

        return $normalized;
    }
}
