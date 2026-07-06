<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Counterparty extends Model
{
    use HasFactory;

    /**
     * Атрибуты, для которых разрешено массовое заполнение.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name', 
        'inn', 
        'kpp', 
        'bank_account', 
        'bank_bik'
    ];
}