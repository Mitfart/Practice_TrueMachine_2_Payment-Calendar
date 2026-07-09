<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Account;
use App\Models\Company;
use App\Models\Counterparty;
use App\Models\Income;
use App\Models\Item;
use App\Models\Payment;
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
        $company = Company::updateOrCreate(
            ['code' => 'DEMO'],
            ['name' => 'DEMO'],
        );

        if (!User::query()->where('role', 'admin')->exists()) {
            User::create([
                'name' => 'Администратор',
                'email' => env('BOOTSTRAP_ADMIN_EMAIL', 'admin@payment-calendar.local'),
                'password' => Hash::make($password),
                'role' => 'admin',
                'company_id' => $company->id,
            ]);
        }
        User::query()->whereNull('company_id')->update(['company_id' => $company->id]);

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
                ['name' => $name, 'password' => Hash::make($password), 'role' => $role, 'company_id' => $company->id],
            );
        }

        $accounts = collect([
            ['Основной расчётный счёт', 2_450_000_00],
            ['Резервный счёт', 820_000_00],
            ['Корпоративная касса', 180_000_00],
        ])->mapWithKeys(function (array $row) use ($company) {
            $account = Account::updateOrCreate(
                ['company_id' => $company->id, 'name' => $row[0]],
                ['currency' => 'RUB', 'opening_balance_kopecks' => $row[1]],
            );
            return [$row[0] => $account];
        });

        $counterparties = collect([
            ['ООО «Вектор»', '7701234567'],
            ['АО «Контур»', '7702345678'],
            ['БЦ «Север»', '7703456789'],
            ['ООО «ТехСнаб»', '7704567890'],
            ['ФНС России', '7707329152'],
            ['Команда DEMO', ''],
        ])->mapWithKeys(function (array $row) use ($company) {
            $counterparty = Counterparty::updateOrCreate(
                ['company_id' => $company->id, 'name' => $row[0]],
                ['inn' => $row[1] ?: null],
            );
            return [$row[0] => $counterparty];
        });

        $items = collect([
            ['Продажи и услуги', 'income'],
            ['Возврат займа', 'income'],
            ['Аренда офиса', 'expense'],
            ['Закупка оборудования', 'expense'],
            ['Налоги', 'expense'],
            ['Заработная плата', 'expense'],
            ['Маркетинг', 'expense'],
        ])->mapWithKeys(function (array $row) use ($company) {
            $item = Item::updateOrCreate(
                ['company_id' => $company->id, 'name' => $row[0]],
                ['type' => $row[1]],
            );
            return [$row[0] => $item];
        });

        foreach ([
            ['2026-06-02', 'ООО «Вектор»', 'Продажи и услуги', 680_000_00],
            ['2026-06-08', 'АО «Контур»', 'Продажи и услуги', 420_000_00],
            ['2026-06-15', 'ООО «Вектор»', 'Продажи и услуги', 910_000_00],
            ['2026-06-24', 'АО «Контур»', 'Возврат займа', 350_000_00],
        ] as [$date, $counterparty, $item, $amount]) {
            Income::updateOrCreate(
                [
                    'company_id' => $company->id,
                    'income_date' => $date,
                    'counterparty_id' => $counterparties[$counterparty]->id,
                    'item_id' => $items[$item]->id,
                ],
                ['account_id' => $accounts['Основной расчётный счёт']->id, 'amount_kopecks' => $amount],
            );
        }

        foreach ([
            ['2026-06-03', 'БЦ «Север»', 'Аренда офиса', 'Аренда офиса за июнь', 280_000_00, 'approved', 'high'],
            ['2026-06-06', 'ООО «ТехСнаб»', 'Закупка оборудования', 'Серверное оборудование', 740_000_00, 'on_approval', 'high'],
            ['2026-06-10', 'ФНС России', 'Налоги', 'НДС за май', 395_000_00, 'on_approval', 'high'],
            ['2026-06-14', 'Команда DEMO', 'Заработная плата', 'Аванс сотрудникам', 520_000_00, 'approved', 'normal'],
            ['2026-06-19', 'ООО «ТехСнаб»', 'Закупка оборудования', 'Лицензии и периферия', 210_000_00, 'draft', 'normal'],
            ['2026-06-25', 'Команда DEMO', 'Заработная плата', 'Заработная плата', 860_000_00, 'approved', 'high'],
            ['2026-06-27', 'ООО «Вектор»', 'Маркетинг', 'Рекламная кампания', 175_000_00, 'rejected', 'low'],
        ] as [$date, $counterparty, $item, $purpose, $amount, $status, $priority]) {
            Payment::updateOrCreate(
                ['company_id' => $company->id, 'purpose' => $purpose],
                [
                    'account_id' => $accounts['Основной расчётный счёт']->id,
                    'counterparty_id' => $counterparties[$counterparty]->id,
                    'item_id' => $items[$item]->id,
                    'amount_kopecks' => $amount,
                    'payment_date' => $date,
                    'status' => $status,
                    'priority' => $priority,
                ],
            );
        }
    }
}
