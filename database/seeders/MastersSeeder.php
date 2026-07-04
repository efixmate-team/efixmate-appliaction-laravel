<?php

namespace Database\Seeders;

use Efixmate\Domain\Models\LkpBookingType;
use Efixmate\Domain\Models\LkpPaymentModes;
use Efixmate\Domain\Models\LkpStatus;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\MstrServiceCategory;
use Illuminate\Database\Seeder;

class MastersSeeder extends Seeder
{
    public function run(): void
    {
        $category = MstrServiceCategory::firstOrCreate(
            ['category_name' => 'Appliance Repair'],
            [
                'order_seq' => 1,
                'description' => 'Home appliance repair and maintenance',
                'is_active' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        MstrService::firstOrCreate(
            ['service' => 'Fridge Repair'],
            [
                'order_seq' => 1,
                'category_id' => $category->category_id,
                'description' => 'Refrigerator diagnosis and repair',
                'is_active' => true,
                'base_price' => 599,
                'image_url' => '',
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        LkpBookingType::firstOrCreate(
            ['booking_type' => 'Standard'],
            ['order_seq' => 1, 'description' => 'Standard scheduled booking', 'is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );

        LkpPaymentModes::firstOrCreate(
            ['payment_mode' => 'Cash'],
            ['order_seq' => 1, 'description' => 'Pay on completion', 'is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );

        LkpStatus::firstOrCreate(
            ['status' => 'Pending'],
            ['order_seq' => 1, 'status_type_id' => 1, 'description' => 'Awaiting confirmation', 'is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );
    }
}
