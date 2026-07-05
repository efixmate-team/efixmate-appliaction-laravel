<?php

namespace Efixmate\Domain\Support;

/**
 * Direct port of the UPLOAD_SLOTS registry in
 * server/src/modules/technician/middleware/upload.middleware.js. Each slot maps
 * to a user-scoped storage path: uploads/{userType}/{userId}/{docType}/.
 */
final class UploadSlots
{
    public const ADMIN_PROMOTION = ['userType' => 'admin', 'docType' => 'promotions'];
    public const ADMIN_SUPPORT = ['userType' => 'admin', 'docType' => 'support'];

    public const TECH_PROFILE = ['userType' => 'technician', 'docType' => 'profile-picture'];
    public const TECH_DOCUMENT = ['userType' => 'technician', 'docType' => 'documents'];
    public const TECH_SELFIE = ['userType' => 'technician', 'docType' => 'selfie'];
    public const TECH_JOB_IMAGES = ['userType' => 'technician', 'docType' => 'job-completed-images'];

    public const USER_PROFILE = ['userType' => 'user', 'docType' => 'profile-picture'];
    public const USER_PROBLEM_IMAGES = ['userType' => 'user', 'docType' => 'problem-images'];
    public const USER_BOOKING_IMAGES = ['userType' => 'user', 'docType' => 'booking-images'];
    public const USER_BOOKING_VIDEOS = ['userType' => 'user', 'docType' => 'booking-videos'];
    public const USER_RECEIPT = ['userType' => 'user', 'docType' => 'receipt'];
}
