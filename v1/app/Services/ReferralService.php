<?php

namespace App\Services;

use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\CustomerWallet;
use Efixmate\Domain\Models\CustomerWalletLedger;
use Efixmate\Domain\Models\Referral;
use Efixmate\Domain\Models\SystemSetting;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianWalletLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Direct port of server/src/modules/referral/referral.service.js.
 */
class ReferralService
{
    private const CONFIG_KEY = 'referral.config';

    private const DEFAULT_CONFIG = [
        'user_enabled' => true,
        'tech_enabled' => true,
        'user_referrer_reward' => 200,
        'user_referred_reward' => 100,
        'tech_referrer_reward' => 500,
        'tech_referred_reward' => 0,
        'trigger' => 'FIRST_BOOKING_COMPLETED',
    ];

    private const IP_WINDOW_MINUTES = 60;
    private const IP_MAX_USES = 3;

    public function getConfig(): array
    {
        $row = SystemSetting::find(self::CONFIG_KEY);

        return $row ? array_merge(self::DEFAULT_CONFIG, $row->setting_value ?? []) : self::DEFAULT_CONFIG;
    }

    public function setConfig(array $patch): array
    {
        $merged = array_merge($this->getConfig(), $patch);

        SystemSetting::updateOrCreate(
            ['setting_key' => self::CONFIG_KEY],
            ['setting_value' => $merged, 'updated_at' => now()]
        );

        return $merged;
    }

    private function generateCode(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = 'EFX';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return $code;
    }

    private function ensureUniqueCode(): string
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = $this->generateCode();
            $exists = Customer::where('referral_code', $code)->exists()
                || Technician::where('referral_code', $code)->orWhere('technician_unique_id', $code)->exists();
            if (! $exists) {
                return $code;
            }
        }

        throw new \RuntimeException('Could not generate unique referral code');
    }

    public function getOrCreateCode(int $userId, string $type): string
    {
        if ($type === 'TECHNICIAN') {
            $technician = Technician::findOrFail($userId);
            if ($technician->technician_unique_id) {
                return $technician->technician_unique_id;
            }
            if ($technician->referral_code) {
                return $technician->referral_code;
            }
            $code = $this->ensureUniqueCode();
            $technician->update(['referral_code' => $code]);

            return $code;
        }

        $customer = Customer::findOrFail($userId);
        if ($customer->referral_code) {
            return $customer->referral_code;
        }
        $code = $this->ensureUniqueCode();
        $customer->update(['referral_code' => $code]);

        return $code;
    }

    public function applyCode(string $code, int $newUserId, string $newUserType, ?string $ip = null): array
    {
        $normalised = Str::upper(trim($code));

        if ($ip) {
            $cutoff = now()->subMinutes(self::IP_WINDOW_MINUTES);
            $count = Referral::where('applied_ip', $ip)->where('created_at', '>', $cutoff)->count();
            if ($count >= self::IP_MAX_USES) {
                return ['error' => 'Too many referral applications from this network. Please try again later.'];
            }
        }

        $customerReferrer = Customer::where('referral_code', $normalised)->first();
        $technicianReferrer = Technician::where('referral_code', $normalised)
            ->orWhere('technician_unique_id', $normalised)
            ->first();

        $referrerId = null;
        $referrerType = null;
        if ($customerReferrer) {
            $referrerId = $customerReferrer->customer_id;
            $referrerType = 'CUSTOMER';
        } elseif ($technicianReferrer) {
            $referrerId = $technicianReferrer->technician_id;
            $referrerType = 'TECHNICIAN';
        }

        if (! $referrerId) {
            return ['error' => 'Invalid referral code'];
        }

        if ((int) $referrerId === (int) $newUserId && $referrerType === $newUserType) {
            return ['error' => 'You cannot use your own referral code'];
        }

        $alreadyReferred = Referral::where('referred_id', $newUserId)->where('referred_type', $newUserType)->exists();
        if ($alreadyReferred) {
            return ['error' => 'Referral code already applied'];
        }

        $cfg = $this->getConfig();
        if ($newUserType === 'TECHNICIAN' && ! $cfg['tech_enabled']) {
            return ['error' => 'Technician referral program is currently disabled'];
        }
        if ($newUserType !== 'TECHNICIAN' && ! $cfg['user_enabled']) {
            return ['error' => 'Customer referral program is currently disabled'];
        }

        $referrerReward = $newUserType === 'TECHNICIAN' ? $cfg['tech_referrer_reward'] : $cfg['user_referrer_reward'];
        $referredReward = $newUserType === 'TECHNICIAN' ? $cfg['tech_referred_reward'] : $cfg['user_referred_reward'];

        $referral = Referral::create([
            'referrer_id' => $referrerId,
            'referrer_type' => $referrerType,
            'referred_id' => $newUserId,
            'referred_type' => $newUserType,
            'referral_code' => $normalised,
            'status' => 'PENDING',
            'trigger_event' => $cfg['trigger'],
            'referrer_reward' => $referrerReward,
            'referred_reward' => $referredReward,
            'applied_ip' => $ip,
            'is_active' => true,
            'created_at' => now(),
        ]);

        $generatedCode = $this->ensureUniqueCode();
        $directColumn = $newUserType === 'TECHNICIAN' && $referrerType === 'TECHNICIAN'
            ? 'referred_by_technician_id'
            : ($newUserType === 'CUSTOMER' && $referrerType === 'CUSTOMER' ? 'referred_by_customer_id' : null);

        if ($newUserType === 'TECHNICIAN') {
            $referred = Technician::findOrFail($newUserId);
        } else {
            $referred = Customer::findOrFail($newUserId);
        }

        $update = ['referral_code' => $referred->referral_code ?? $generatedCode];
        if ($directColumn) {
            $update[$directColumn] = $referrerId;
        }
        $referred->update($update);

        return [
            'referral_id' => $referral->referral_id,
            'referrer_reward' => (float) $referrerReward,
            'referred_reward' => (float) $referredReward,
        ];
    }

    public function getStats(int $userId, string $type): array
    {
        $referrerType = $type === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';

        $rows = Referral::where('referrer_id', $userId)
            ->where('referrer_type', $referrerType)
            ->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $rewarded = $rows->where('status', 'REWARDED')->count();
        $totalEarned = $rows->where('status', 'REWARDED')->sum('referrer_reward');

        $referrals = $rows->map(function (Referral $r) {
            $name = null;
            $uniqueId = null;
            if ($r->referred_type === 'CUSTOMER') {
                $c = Customer::find($r->referred_id);
                $name = $c ? trim("{$c->first_name} {$c->last_name}") : null;
            } elseif ($r->referred_type === 'TECHNICIAN') {
                $t = Technician::find($r->referred_id);
                $name = $t ? trim("{$t->first_name} {$t->last_name}") : null;
                $uniqueId = $t?->technician_unique_id;
            }

            return [
                'id' => $r->referral_id,
                'name' => $name ?: 'eFixMate User',
                'technician_unique_id' => $uniqueId,
                'type' => $r->referred_type,
                'status' => $r->status,
                'reward' => (float) $r->referrer_reward,
                'joined_at' => $r->created_at,
                'rewarded_at' => $r->rewarded_at,
            ];
        });

        return [
            'total_referrals' => $rows->count(),
            'rewarded' => $rewarded,
            'pending' => $rows->count() - $rewarded,
            'total_earned' => (float) $totalEarned,
            'referrals' => $referrals->values(),
        ];
    }

    public function creditReferralReward(int $bookingId, int $customerId): void
    {
        $cfg = $this->getConfig();
        if (! $cfg['user_enabled']) {
            return;
        }

        $hadPreviousCompleted = DB::table('efm_bookings')
            ->where('customer_id', $customerId)
            ->where('booking_status_id', 4)
            ->where('booking_id', '!=', $bookingId)
            ->exists();
        if ($hadPreviousCompleted) {
            return;
        }

        $referral = Referral::where('referred_id', $customerId)
            ->where('referred_type', 'CUSTOMER')
            ->where('status', 'PENDING')
            ->first();
        if (! $referral) {
            return;
        }

        if ((float) $referral->referred_reward > 0) {
            $this->creditCustomerWallet($customerId, (float) $referral->referred_reward, 'REFERRAL_REWARD', 'Referral welcome reward', $bookingId);
        }

        if ($referral->referrer_type === 'CUSTOMER' && (float) $referral->referrer_reward > 0) {
            $this->creditCustomerWallet($referral->referrer_id, (float) $referral->referrer_reward, 'REFERRAL_BONUS', "Referral bonus for booking #{$bookingId}", $bookingId);
        } elseif ($referral->referrer_type === 'TECHNICIAN' && (float) $referral->referrer_reward > 0) {
            $this->creditTechnicianWallet($referral->referrer_id, (float) $referral->referrer_reward, 'REFERRAL_BONUS', "Referral bonus for booking #{$bookingId}", $bookingId);
        }

        $referral->update(['status' => 'REWARDED', 'rewarded_at' => now()]);
    }

    public function creditTechReferralReward(int $technicianId, int $bookingId): void
    {
        $cfg = $this->getConfig();
        if (! $cfg['tech_enabled']) {
            return;
        }

        $hadPreviousJob = DB::table('efm_bookings')
            ->where('technician_id', $technicianId)
            ->where('booking_status_id', 4)
            ->where('booking_id', '!=', $bookingId)
            ->exists();
        if ($hadPreviousJob) {
            return;
        }

        $referral = Referral::where('referred_id', $technicianId)
            ->where('referred_type', 'TECHNICIAN')
            ->where('status', 'PENDING')
            ->first();
        if (! $referral) {
            return;
        }

        if ((float) $referral->referred_reward > 0) {
            $this->creditTechnicianWallet($technicianId, (float) $referral->referred_reward, 'REFERRAL_REWARD', 'Referral welcome reward', $bookingId);
        }

        if ($referral->referrer_type === 'TECHNICIAN' && (float) $referral->referrer_reward > 0) {
            $this->creditTechnicianWallet($referral->referrer_id, (float) $referral->referrer_reward, 'REFERRAL_BONUS', "Referral bonus for tech job #{$bookingId}", $bookingId);
        } elseif ($referral->referrer_type === 'CUSTOMER' && (float) $referral->referrer_reward > 0) {
            $this->creditCustomerWallet($referral->referrer_id, (float) $referral->referrer_reward, 'REFERRAL_BONUS', "Referral bonus for technician job #{$bookingId}", $bookingId);
        }

        $referral->update(['status' => 'REWARDED', 'rewarded_at' => now()]);
    }

    private function creditCustomerWallet(int $customerId, float $amount, string $entryType, string $note, ?int $bookingId): void
    {
        $lastBalance = (float) (CustomerWalletLedger::where('customer_id', $customerId)->orderByDesc('ledger_id')->value('balance_after') ?? 0);
        $newBalance = $lastBalance + $amount;

        CustomerWalletLedger::create([
            'customer_id' => $customerId,
            'booking_id' => $bookingId,
            'entry_type' => $entryType,
            'amount' => $amount,
            'balance_after' => $newBalance,
            'meta' => ['note' => $note],
            'created_at' => now(),
        ]);

        $wallet = CustomerWallet::find($customerId);
        if ($wallet) {
            $wallet->increment('balance', $amount);
            $wallet->update(['updated_at' => now()]);
        } else {
            CustomerWallet::create(['customer_id' => $customerId, 'balance' => $amount, 'updated_at' => now()]);
        }
    }

    private function creditTechnicianWallet(int $technicianId, float $amount, string $entryType, string $note, ?int $bookingId): void
    {
        $lastBalance = (float) (TechnicianWalletLedger::where('technician_id', $technicianId)->orderByDesc('ledger_id')->value('balance_after') ?? 0);
        $newBalance = $lastBalance + $amount;

        TechnicianWalletLedger::create([
            'technician_id' => $technicianId,
            'booking_id' => $bookingId,
            'entry_type' => $entryType,
            'amount' => $amount,
            'balance_after' => $newBalance,
            'meta' => ['note' => $note],
            'created_at' => now(),
        ]);
    }
}
