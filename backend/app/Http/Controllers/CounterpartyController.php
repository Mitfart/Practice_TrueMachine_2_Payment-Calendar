<?php

namespace App\Http\Controllers;

use App\Models\Counterparty;
use Illuminate\Http\Request;

class CounterpartyController extends Controller
{
    public function index(Request $request)
    {
        return Counterparty::where('company_id', $request->user()->company_id)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'inn' => 'nullable|string|max:12',
            'kpp' => 'nullable|string|max:9',
            'bank_account' => 'nullable|string|max:20',
            'bank_bik' => 'nullable|string|max:9',
        ]);

        $validated['company_id'] = $request->user()->company_id;
        return Counterparty::create($validated);
    }

    public function show(Counterparty $counterparty)
    {
        return $counterparty;
    }

    public function update(Request $request, Counterparty $counterparty)
    {
        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'inn'          => 'sometimes|string|max:12',
            'kpp'          => 'nullable|string|size:9',
            'bank_account' => 'sometimes|string|max:20',
            'bank_bik'     => 'sometimes|string|size:9',
        ]);

        $counterparty->update($validated);
        return $counterparty;
    }

    public function destroy(Counterparty $counterparty)
    {
        $counterparty->delete();
        return response()->noContent();
    }
}
