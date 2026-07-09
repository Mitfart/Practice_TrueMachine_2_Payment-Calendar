<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = env('BOOTSTRAP_USER_PASSWORD', 'Chicken_Road_K10_28');

        if (!User::query()->where('role', 'admin')->exists()) {
            User::create([
                'name' => 'Администратор',
                'email' => env('BOOTSTRAP_ADMIN_EMAIL', 'admin@payment-calendar.local'),
                'password' => Hash::make($password),
                'role' => 'admin',
            ]);
        }

        if (!app()->hasDebugModeEnabled()) {
            return;
        }

        foreach ([
            ['Инициатор', 'initiator@payment-calendar.local', 'initiator'],
            ['Казначей', 'treasurer@payment-calendar.local', 'treasurer'],
            ['Руководитель', 'manager@payment-calendar.local', 'manager'],
        ] as [$name, $email, $role]) {
            User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make($password), 'role' => $role],
            );
        }
    }
}
