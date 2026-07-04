<?php

namespace Efixmate\Domain\Support;

/**
 * PHP mirror of server/src/constants/bookingStatus.js (BOOKING_STATUS + BOOKING_STATUS_NAMES)
 * from the source Node app, so both Laravel apps compute status names identically.
 */
final class BookingStatus
{
    public const PENDING = 1;
    public const CONFIRMED_LEGACY = 2;
    public const IN_PROGRESS = 3;
    public const COMPLETED = 4;
    public const CANCELLED = 5;
    public const FAILED = 6;
    public const REFUNDED = 7;
    public const BROADCASTED = 20;
    public const TECH_ACCEPTED = 21;
    public const ON_THE_WAY = 22;
    public const ARRIVED = 23;
    public const STARTED = 24;
    public const NO_SERVICE = 25;

    /** @var array<int, string> */
    private const NAMES = [
        self::PENDING => 'PENDING',
        self::CONFIRMED_LEGACY => 'CONFIRMED',
        self::IN_PROGRESS => 'IN PROGRESS',
        self::COMPLETED => 'COMPLETED',
        self::CANCELLED => 'CANCELLED',
        self::FAILED => 'FAILED',
        self::REFUNDED => 'REFUNDED',
        self::BROADCASTED => 'BROADCASTED',
        self::TECH_ACCEPTED => 'TECH ACCEPTED',
        self::ON_THE_WAY => 'ON THE WAY',
        self::ARRIVED => 'ARRIVED',
        self::STARTED => 'STARTED',
        self::NO_SERVICE => 'NO SERVICE',
    ];

    public static function label(?int $statusId): string
    {
        return self::NAMES[$statusId] ?? 'UNKNOWN';
    }
}
