<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Registry extends Model
{
    use HasFactory;

    /**
     * Атрибуты, для которых разрешено массовое заполнение.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id', 
        'created_by', 
        'registry_date', 
        'status'
    ];

    /**
     * Получить счет, к которому привязан данный реестр.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Получить пользователя, который создал реестр.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Получить платежи, включенные в этот реестр (Связь Многие ко многим).
     */
    public function payments(): BelongsToMany
    {
        return $this->belongsToMany(Payment::class, 'registry_payment');
    }
}