<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('counterparties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('inn', 12)->nullable();       // ИНН
            $table->string('kpp', 9)->nullable();         // КПП
            $table->string('bank_account', 20)->nullable(); // расчётный счёт
            $table->string('bank_bik', 9)->nullable();    // БИК банка
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('counterparties');
    }
};
