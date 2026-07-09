<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        foreach (['users', 'accounts', 'counterparties', 'items', 'payments', 'incomes', 'registries'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['registries', 'incomes', 'payments', 'items', 'counterparties', 'accounts', 'users'] as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropConstrainedForeignId('company_id'));
        }
        Schema::dropIfExists('companies');
    }
};
