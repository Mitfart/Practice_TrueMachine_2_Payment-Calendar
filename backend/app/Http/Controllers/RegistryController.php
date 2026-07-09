<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Registry;
use Illuminate\Http\Request;

class RegistryController extends Controller
{
    public function index(Request $request)
    {
        return Registry::with('payments')
            ->where('company_id', $request->user()->company_id)
            ->get();
    }

    // Формирование реестра из согласованных заявок за дату
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'registry_date' => 'required|date',
        ]);

        $payments = Payment::where('account_id', $validated['account_id'])
            ->where('company_id', $request->user()->company_id)
            ->where('status', 'approved')
            ->whereDate('payment_date', $validated['registry_date'])
            ->get();

        if ($payments->isEmpty()) {
            return response()->json(['message' => 'Нет согласованных заявок на эту дату'], 422);
        }

        $registry = Registry::create([
            'account_id' => $validated['account_id'],
            'created_by' => $request->user()->id,
            'registry_date' => $validated['registry_date'],
            'status' => 'draft',
            'company_id' => $request->user()->company_id,
        ]);

        // Привязываем платежи к реестру в пивот-таблице
        $registry->payments()->attach($payments->pluck('id'));
        
        // ИСПРАВЛЕНО: Убраны лишние скобки () у $payments
        $payments->each(fn ($p) => $p->update(['status' => 'in_registry']));

        return $registry->load('payments');
    }

    public function show(Registry $registry)
    {
        return $registry->load('payments');
    }

    // ИСПРАВЛЕНО: Дублирующий импорт "use" удален из тела класса

    public function export(Registry $registry)
    {
        $registry->load('payments.account', 'payments.counterparty', 'payments.item');

        $csv = "Дата реестра,Счёт,Контрагент,Статья,Назначение,Сумма\n";
        foreach ($registry->payments as $payment) {
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%.2f\n",
                $registry->registry_date,
                $payment->account->name,
                $payment->counterparty->name,
                $payment->item->name,
                str_replace(',', ';', $payment->purpose ?? ''),
                $payment->amount_kopecks / 100
            );
        }

        $filename = 'registry_' . $registry->id . '_' . $registry->registry_date . '.csv';

        // ИСПРАВЛЕНО: Используем глобальный хелпер response() вместо фасада Response
        return response("\xEF\xBB\xBF" . $csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }

    // Отметить реестр как оплаченный — статус переходит на все платежи внутри
    public function markPaid(Registry $registry)
    {
        if ($registry->status === 'paid') {
            return response()->json(['message' => 'Реестр уже оплачен'], 422);
        }

        $registry->update(['status' => 'paid']);
        
        // ОПТИМИЗАЦИЯ: Обновляем статус одним SQL-запросом для всех связанных платежей
        $registry->payments()->update(['status' => 'paid']);

        return $registry->load('payments');
    }
}
