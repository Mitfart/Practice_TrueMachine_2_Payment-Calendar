<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Income;
use App\Models\Payment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ReportController extends Controller
{
    // 1. Остатки по счетам на конкретную дату / на конец периода
    public function balances(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $onDate = Carbon::parse($validated['date'])->startOfDay();
        $accounts = Account::all();
        $result = [];

        foreach ($accounts as $account) {
            $incomeSum = Income::where('account_id', $account->id)
                ->where('income_date', '<=', $onDate->toDateString())
                ->sum('amount_kopecks');

            $expenseSum = Payment::where('account_id', $account->id)
                ->whereIn('status', ['approved', 'in_registry', 'paid'])
                ->where('payment_date', '<=', $onDate->toDateString())
                ->sum('amount_kopecks');

            $balance = $account->opening_balance_kopecks + $incomeSum - $expenseSum;

            $result[] = [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'balance_on_date' => $balance,
                'is_gap' => $balance < 0,
            ];
        }

        return response()->json($result);
    }

    // 2. Список ближайших кассовых разрывов (следующие N дней)
    public function upcomingGaps(Request $request)
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:365',
        ]);

        $daysAhead = (int) ($validated['days'] ?? 30);
        $from = Carbon::today();
        $to = Carbon::today()->addDays($daysAhead);

        $accounts = Account::all();
        $gaps = [];

        foreach ($accounts as $account) {
            $incomes = Income::where('account_id', $account->id)
                ->whereBetween('income_date', [$from->toDateString(), $to->toDateString()])
                ->selectRaw('income_date, sum(amount_kopecks) as total')
                ->groupBy('income_date')
                ->pluck('total', 'income_date');

            $expenses = Payment::where('account_id', $account->id)
                ->whereIn('status', ['approved', 'in_registry', 'paid'])
                ->whereBetween('payment_date', [$from->toDateString(), $to->toDateString()])
                ->selectRaw('payment_date, sum(amount_kopecks) as total')
                ->groupBy('payment_date')
                ->pluck('total', 'payment_date');

            $balance = $account->opening_balance_kopecks;

            foreach (CarbonPeriod::create($from, $to) as $day) {
                $dateKey = $day->toDateString();
                $balance += (int) ($incomes[$dateKey] ?? 0) - (int) ($expenses[$dateKey] ?? 0);

                if ($balance < 0) {
                    $gaps[] = [
                        'account_id' => $account->id,
                        'account_name' => $account->name,
                        'date' => $dateKey,
                        'balance' => $balance,
                    ];
                }
            }
        }

        return response()->json($gaps);
    }

    // 3. План/факт по поступлениям и платежам за период
    public function planFact(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $incomePlan = Income::whereBetween('income_date', [$validated['from'], $validated['to']])
            ->sum('amount_kopecks');

        $expensePlan = Payment::whereIn('status', ['draft', 'on_approval', 'approved', 'in_registry', 'paid'])
            ->whereBetween('payment_date', [$validated['from'], $validated['to']])
            ->sum('amount_kopecks');

        $expenseFact = Payment::where('status', 'paid')
            ->whereBetween('payment_date', [$validated['from'], $validated['to']])
            ->sum('amount_kopecks');

        return response()->json([
            'period' => ['from' => $validated['from'], 'to' => $validated['to']],
            'income_plan' => $incomePlan,
            'expense_plan' => $expensePlan,
            'expense_fact' => $expenseFact,
        ]);
    }

    // 4. Выгрузка отчёта об остатках в CSV
    public function exportBalances(Request $request)
    {
        $validated = $request->validate(['date' => 'required|date']);
        $data = $this->balances($request)->getData(true);

        $csv = "Счёт,Остаток на дату,Кассовый разрыв\n";
        foreach ($data as $row) {
            $csv .= sprintf(
                "%s,%.2f,%s\n",
                $row['account_name'],
                $row['balance_on_date'] / 100,
                $row['is_gap'] ? 'Да' : 'Нет'
            );
        }

        $filename = 'balances_' . $validated['date'] . '.csv';

        return Response::make("\xEF\xBB\xBF" . $csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }
}