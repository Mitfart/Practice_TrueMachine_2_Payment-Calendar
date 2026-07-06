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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained();
            $table->foreignId('counterparty_id')->constrained();
            $table->foreignId('item_id')->constrained();
            $table->bigInteger('amount_kopecks'); // сумма в копейках, без потери точности
            $table->date('payment_date');
            $table->string('purpose')->nullable(); // назначение платежа
            $table->enum('priority', ['low', 'normal', 'high'])->default('normal');
            $table->enum('status', [
                'draft', 'on_approval', 'approved', 'in_registry', 'paid', 'rejected'
            ])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
