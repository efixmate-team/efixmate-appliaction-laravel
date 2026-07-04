<?php

namespace App\Contracts;

interface SmsGateway
{
    public function sendOtp(string $mobileNumber, string $otp): void;
}
