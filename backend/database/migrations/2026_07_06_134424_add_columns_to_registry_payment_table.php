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
        Schema::table('registry_payment', function (Blueprint $table) {
            $table->foreignId('registry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registry_payment', function (Blueprint $table) {
            $table->dropForeign(['registry_id']);
            $table->dropForeign(['payment_id']);
            $table->dropColumn(['registry_id', 'payment_id']);
        });
    }
};
