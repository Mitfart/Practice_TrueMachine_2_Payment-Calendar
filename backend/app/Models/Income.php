<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
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
        'income_date',
        'company_id',
    ];

    /**
     * Получить счет, связанный с поступлением.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Получить контрагента, связанного с поступлением.
     */
    public function counterparty(): BelongsTo
    {
        return $this->belongsTo(Counterparty::class);
    }

    /**
     * Получить номенклатуру (товар/услугу), связанную с поступлением.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
