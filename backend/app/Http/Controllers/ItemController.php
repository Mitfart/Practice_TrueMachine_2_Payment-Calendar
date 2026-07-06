<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index()
    {
        return Item::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50', // Например: 'product' или 'service'
        ]);

        return Item::create($validated);
    }

    public function show(Item $item)
    {
        return $item;
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:50',
        ]);

        $item->update($validated);
        return $item;
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return response()->noContent();
    }
}