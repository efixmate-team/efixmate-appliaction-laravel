<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Direct port of server/src/utils/uploadPath.js's toPublicUploadUrl/toAbsolutePublicUrl.
 * Priority: CDN_BASE_URL env (if set) > app.url > request origin > raw relative path.
 */
class PublicUrlResolver
{
    public static function resolve(Request $request, ?string $storedPath): ?string
    {
        if (! $storedPath) {
            return null;
        }

        if (preg_match('#^https?://#i', $storedPath)) {
            return $storedPath;
        }

        $rel = str_starts_with($storedPath, '/') ? $storedPath : "/uploads/{$storedPath}";
        $encoded = implode('/', array_map('rawurlencode', explode('/', ltrim($rel, '/'))));
        $encoded = '/'.$encoded;

        $cdn = rtrim((string) config('services.cdn_base_url'), '/');
        if ($cdn) {
            return $cdn.$encoded;
        }

        $base = rtrim((string) config('app.url'), '/');
        if ($base) {
            return $base.$encoded;
        }

        return $request->getSchemeAndHttpHost().$encoded;
    }
}
