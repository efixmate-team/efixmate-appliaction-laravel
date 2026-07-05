<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Direct port of createUserUpload()/processUploadedFile()/relativeUploadPath() in
 * server/src/modules/technician/middleware/upload.middleware.js. Laravel's Request
 * already parses multipart files (no Multer-equivalent middleware needed) — this
 * service replicates the validation + user-scoped-path + relative-path-for-DB
 * behavior a controller calls directly after pulling the file off the request.
 *
 * Storage root: storage/app/private/uploads (local disk) — public URLs are served
 * via a future signed/public route in whichever stage first needs to expose them,
 * mirroring the Node app's own /uploads static-file mount.
 */
class FileUploadService
{
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp', 'tiff'];
    private const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];

    public function __construct(private UploadPolicyService $policy) {}

    private function isImage(UploadedFile $file): bool
    {
        return str_starts_with((string) $file->getMimeType(), 'image/')
            || in_array(strtolower($file->getClientOriginalExtension()), self::IMAGE_EXTENSIONS, true);
    }

    private function isVideo(UploadedFile $file): bool
    {
        return str_starts_with((string) $file->getMimeType(), 'video/')
            || in_array(strtolower($file->getClientOriginalExtension()), self::VIDEO_EXTENSIONS, true);
    }

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    private function validateAgainstPolicy(UploadedFile $file): void
    {
        $policy = $this->policy->get();
        $ext = strtolower($file->getClientOriginalExtension());

        $bucket = $this->isImage($file) ? 'images' : ($this->isVideo($file) ? 'videos' : 'documents');
        $rules = $policy[$bucket];

        if (! in_array($ext, $rules['acceptedFormats'], true)) {
            abort(400, ucfirst(rtrim($bucket, 's')).' format .'.($ext ?: 'unknown').' is not allowed.');
        }

        $maxBytes = UploadPolicyService::mbToBytes($rules['maxUploadMb']);
        if ($file->getSize() > $maxBytes) {
            abort(400, ucfirst(rtrim($bucket, 's'))." must be {$rules['maxUploadMb']} MB or smaller.");
        }
    }

    /**
     * Stores $file under uploads/{slot.userType}/{userId}/{slot.docType}/ and
     * returns the path relative to the uploads root (for DB storage / URL building),
     * matching relativeUploadPath()'s output shape exactly.
     *
     * @param array{userType: string, docType: string} $slot one of UploadSlots::*
     */
    public function store(UploadedFile $file, array $slot, string|int $userId, bool $imagesOnly = false): string
    {
        if ($imagesOnly && ! $this->isImage($file)) {
            abort(400, 'Only image files are allowed');
        }

        $this->validateAgainstPolicy($file);

        $dir = "uploads/{$slot['userType']}/{$userId}/{$slot['docType']}";
        $baseName = str_replace(' ', '_', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $filename = now()->timestamp.'_'.$baseName.'.'.$file->getClientOriginalExtension();

        $file->storeAs($dir, $filename, 'local');

        return "{$slot['userType']}/{$userId}/{$slot['docType']}/{$filename}";
    }
}
