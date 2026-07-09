<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Income;
use App\Models\Payment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'account_id' => 'nullable|exists:accounts,id',
            'item_id' => 'nullable|exists:items,id',
            'counterparty_id' => 'nullable|exists:counterparties,id',
            'status' => 'nullable|in:draft,on_approval,approved,in_registry,paid,rejected',
        ]);

        $from = Carbon::parse($validated['from'])->startOfDay();
        $to = Carbon::parse($validated['to'])->startOfDay();

        $accounts = $request->filled('account_id')
            ? Account::where('id', $validated['account_id'])->get()
            : Account::all();

        $result = [];

        foreach ($accounts as $account) {
            // подтягиваем все движения по счёту за период одним запросом,
            // а не дёргаем базу в цикле по каждому дню — это важно для НФТ (3 сек на месяц)
            $incomes = Income::where('account_id', $account->id)
                ->when($request->filled('item_id'), fn ($query) => $query->where('item_id', $validated['item_id']))
                ->when($request->filled('counterparty_id'), fn ($query) => $query->where('counterparty_id', $validated['counterparty_id']))
                ->whereBetween('income_date', [$from->toDateString(), $to->toDateString()])
                ->selectRaw('income_date, sum(amount_kopecks) as total')
                ->groupBy('income_date')
                ->pluck('total', 'income_date');

            $expenses = Payment::where('account_id', $account->id)
                ->when(
                    $request->filled('status'),
                    fn ($query) => $query->where('status', $validated['status']),
                    fn ($query) => $query->whereIn('status', ['approved', 'in_registry', 'paid'])
                )
                ->when($request->filled('item_id'), fn ($query) => $query->where('item_id', $validated['item_id']))
                ->when($request->filled('counterparty_id'), fn ($query) => $query->where('counterparty_id', $validated['counterparty_id']))
                ->whereBetween('payment_date', [$from->toDateString(), $to->toDateString()])
                ->selectRaw('payment_date, sum(amount_kopecks) as total')
                ->groupBy('payment_date')
                ->pluck('total', 'payment_date');

            $balance = $account->opening_balance_kopecks;
            $days = [];

            foreach (CarbonPeriod::create($from, $to) as $day) {
                $dateKey = $day->toDateString();
                $income = (int) ($incomes[$dateKey] ?? 0);
                $expense = (int) ($expenses[$dateKey] ?? 0);

                $balance += $income - $expense;

                $days[$dateKey] = [
                    'income' => $income,
                    'expense' => $expense,
                    'balance' => $balance,
                    'is_gap' => $balance < 0,
                ];
            }

            $result[$account->id] = [
                'account_name' => $account->name,
                'days' => $days,
            ];
        }

        return response()->json($result);
    }
}
