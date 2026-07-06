<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index()
    {
        return Account::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'currency' => 'required|string|size:3',
            'opening_balance_kopecks' => 'required|integer',
        ]);

        return Account::create($validated);
    }

    public function show(Account $account)
    {
        return $account;
    }

    public function update(Request $request, Account $account)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|size:3',
            'opening_balance_kopecks' => 'sometimes|integer',
        ]);

        $account->update($validated);
        return $account;
    }

    public function destroy(Account $account)
    {
        $account->delete();
        return response()->noContent();
    }
}