<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    use HasFactory;

    /**
     * Атрибуты, для которых разрешено массовое заполнение.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'payment_id', 
        'user_id', 
        'decision', // Например: 'approved', 'rejected'
        'comment'
    ];

    /**
     * Получить платеж, к которому относится это согласование.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Получить пользователя (согласующего), который принял решение.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}