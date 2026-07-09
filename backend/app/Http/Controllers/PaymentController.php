<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Approval;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        // Подгружаем связи и историю согласований, чтобы избежать проблемы N+1
        return Payment::with(['account', 'counterparty', 'item', 'approvals'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id'      => 'required|exists:accounts,id',
            'counterparty_id' => 'required|exists:counterparties,id',
            'item_id'         => 'required|exists:items,id',
            'amount_kopecks'  => 'required|integer|min:1',
            'payment_date'    => 'required|date',
            'purpose'         => 'nullable|string|max:1000',
            'priority'        => 'sometimes|in:low,normal,high',
            'status'          => 'sometimes|in:draft,on_approval,approved,in_registry,paid,rejected',
        ]);

        // По умолчанию при создании платеж обычно получает статус draft, если не передан иной
        if (!isset($validated['status'])) {
            $validated['status'] = 'draft';
        }

        $payment = Payment::create($validated);
        
        return $payment->load(['account', 'counterparty', 'item', 'approvals']);
    }

    public function show(Payment $payment)
    {
        return $payment->load(['account', 'counterparty', 'item', 'approvals']);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'account_id'      => 'sometimes|exists:accounts,id',
            'counterparty_id' => 'sometimes|exists:counterparties,id',
            'item_id'         => 'sometimes|exists:items,id',
            'amount_kopecks'  => 'sometimes|integer|min:1',
            'payment_date'    => 'sometimes|date',
            'purpose'         => 'nullable|string|max:1000',
            'priority'        => 'sometimes|in:low,normal,high',
            'status'          => 'sometimes|in:draft,on_approval,approved,in_registry,paid,rejected',
        ]);

        $payment->update($validated);
        return $payment->load(['account', 'counterparty', 'item', 'approvals']);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->noContent();
    }

    /**
     * Инициатор отправляет черновик на согласование.
     */
    public function submitForApproval(Payment $payment)
    {
        if ($payment->status !== 'draft') {
            return response()->json([
                'message' => 'Отправить на согласование можно только черновик'
            ], 422);
        }

        $payment->update(['status' => 'on_approval']);
        
        return $payment->load(['account', 'counterparty', 'item', 'approvals']);
    }

    /**
     * Руководитель выносит решение (согласовано / отклонено).
     */
    public function decide(Request $request, Payment $payment)
    {
        if ($payment->status !== 'on_approval') {
            return response()->json([
                'message' => 'Заявка не находится на согласовании'
            ], 422);
        }

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'comment'  => 'nullable|string|max:1000',
        ]);

        Approval::create([
            'payment_id' => $payment->id,
            'user_id'    => $request->user()->id, // ID текущего авторизованного руководителя
            'decision'   => $validated['decision'],
            'comment'    => $validated['comment'] ?? null,
        ]);

        // Статус платежа меняется на 'approved' или 'rejected' в зависимости от решения
        $payment->update(['status' => $validated['decision']]);

        return $payment->load(['account', 'counterparty', 'item', 'approvals']);
    }
}
