<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Registry;
use Illuminate\Http\Request;

class RegistryController extends Controller
{
    public function index()
    {
        return Registry::with('payments')->get();
    }

    // Формирование реестра из согласованных заявок за дату
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'registry_date' => 'required|date',
        ]);

        $payments = Payment::where('account_id', $validated['account_id'])
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
        ]);

        $registry->payments()->attach($payments->pluck('id'));
        $payments->each(fn ($p) => $p->update(['status' => 'in_registry']));

        return $registry->load('payments');
    }

    public function show(Registry $registry)
    {
        return $registry->load('payments');
    }

    // Отметить реестр как оплаченный — статус переходит на все платежи внутри
    public function markPaid(Registry $registry)
    {
        if ($registry->status === 'paid') {
            return response()->json(['message' => 'Реестр уже оплачен'], 422);
        }

        $registry->update(['status' => 'paid']);
        $registry->payments()->each(fn ($p) => $p->update(['status' => 'paid']));

        return $registry->load('payments');
    }
}