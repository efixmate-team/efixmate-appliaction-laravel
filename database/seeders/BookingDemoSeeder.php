<?php

namespace Database\Seeders;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\CustomerAddress;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Database\Seeder;

/** Depends on MastersSeeder having already run (needs the seeded service/category). */
class BookingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = Customer::firstOrCreate(
            ['mobile_number' => '9555555555'],
            [
                'customer_uid' => (string) str()->uuid(),
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'mobile_verified' => true,
                'is_active' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        $address = CustomerAddress::firstOrCreate(
            ['customer_id' => $customer->customer_id],
            [
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'country' => 'India',
                'pincode' => 411001,
                'latitude' => '18.5204',
                'longitude' => '73.8567',
                'is_active' => true,
                'is_selected' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        Technician::firstOrCreate(
            ['mobile_number' => '9666666666'],
            [
                'first_name' => 'Rahul',
                'last_name' => 'Sharma',
                'is_selfie_verified' => true,
                'is_active' => true,
                'application_status' => 'approved',
                'current_jobs' => 0,
                'max_jobs' => 3,
                'is_online' => true,
                'vacation_mode' => false,
                'geo_fence_enabled' => false,
                'service_radius_km' => 10,
                'availability_status' => 'AVAILABLE',
                'avg_rating' => 0,
                'review_count' => 0,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        $service = MstrService::where('service', 'Fridge Repair')->firstOrFail();

        Booking::firstOrCreate(
            ['booking_uid' => 'BKG-DEMOSEED01'],
            [
                'customer_id' => $customer->customer_id,
                'address_id' => $address->address_id,
                'service_category_id' => $service->category_id,
                'service_id' => $service->service_id,
                'booking_type_id' => 1,
                'quantity' => 1,
                'base_price' => $service->base_price,
                'unit_price' => $service->base_price,
                'booking_status_id' => BookingStatus::PENDING,
                'lifecycle_state' => 'CREATED',
                'problem_description' => 'Fridge not cooling',
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );
    }
}
