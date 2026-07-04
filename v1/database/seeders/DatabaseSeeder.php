<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * v1 never seeds domain data itself — the outer app's seeders (Stage 8) own the
     * shared database's demo data. This app only reads/writes it via its own connection.
     */
    public function run(): void {}
}
