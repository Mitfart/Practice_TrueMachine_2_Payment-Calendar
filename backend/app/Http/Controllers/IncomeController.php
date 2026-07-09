<?php

namespace App\Http\Controllers;

use App\Models\Income;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    public function index(Request $request)
    {
        return Income::with(['account', 'counterparty', 'item'])
            ->where('company_id', $request->user()->company_id)
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id'      => 'required|exists:accounts,id',
            'counterparty_id' => 'required|exists:counterparties,id',
            'item_id'         => 'required|exists:items,id',
            'amount_kopecks'  => 'required|integer|min:1',
            'income_date'     => 'required|date',
        ]);

        $validated['company_id'] = $request->user()->company_id;
        $income = Income::create($validated);
        return $income->load(['account', 'counterparty', 'item']);
    }

    public function show(Income $income)
    {
        return $income->load(['account', 'counterparty', 'item']);
    }

    public function update(Request $request, Income $income)
    {
        $validated = $request->validate([
            'account_id'      => 'sometimes|exists:accounts,id',
            'counterparty_id' => 'sometimes|exists:counterparties,id',
            'item_id'         => 'sometimes|exists:items,id',
            'amount_kopecks'  => 'sometimes|integer|min:1',
            'income_date'     => 'sometimes|date',
        ]);

        $income->update($validated);
        return $income->load(['account', 'counterparty', 'item']);
    }

    public function destroy(Income $income)
    {
        $income->delete();
        return response()->noContent();
    }
}
