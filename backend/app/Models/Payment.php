<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany; // Импортируем класс связи HasMany

class Payment extends Model
{
    use HasFactory;

    /**
     * Атрибуты, для которых разрешено массовое заполнение.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id', 
        'counterparty_id', 
        'item_id',
        'amount_kopecks', 
        'payment_date', 
        'purpose', 
        'priority', 
        'status',
        'company_id',
    ];

    /**
     * Получить историю согласований данного платежа.
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    /**
     * Получить счет, связанный с платежом.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Получить контрагента, связанного с платежом.
     */
    public function counterparty(): BelongsTo
    {
        return $this->belongsTo(Counterparty::class);
    }

    /**
     * Получить номенклатуру (товар/услугу), связанную с платежом.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
