<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Импорт контроллеров
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\CounterpartyController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\RegistryController;
use App\Http\Controllers\ReportController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (Без токена)
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/debug/users', [AuthController::class, 'debugUsers']);
Route::post('/debug/login/{user}', [AuthController::class, 'debugLogin']);


// ==========================================
// 2. ЗАЩИЩЁННЫЕ МАРШРУТЫ (Только с Bearer токеном)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Аутентификация сессии
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::middleware('role:manager,admin')->group(function () {
        Route::get('/users', [AuthController::class, 'users']);
        Route::post('/users', [AuthController::class, 'createUser']);
    });
    
    // Основные финансовые ресурсы и календарь
    Route::get('/calendar', [CalendarController::class, 'index']);
    Route::apiResource('counterparties', CounterpartyController::class);
    Route::apiResource('items', ItemController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('incomes', IncomeController::class);


    //че-то необходимое
    Route::middleware('role:initiator,admin')->post('/payments/{payment}/submit', [PaymentController::class, 'submitForApproval']);
    Route::middleware('role:manager,admin')->post('/payments/{payment}/decide', [PaymentController::class, 'decide']);

    //это для реестра
    Route::middleware('role:treasurer,admin')->group(function () {
    Route::apiResource('registries', RegistryController::class)->only(['index', 'store', 'show']);
    Route::post('/registries/{registry}/mark-paid', [RegistryController::class, 'markPaid']);});

    // Счета (Accounts): обычные юзеры могут только смотреть
    Route::apiResource('accounts', AccountController::class)->only(['index', 'show']);
    Route::middleware('role:treasurer,admin')->get('/registries/{registry}/export', [RegistryController::class, 'export']);
    // репорт


    Route::middleware('role:manager,treasurer,admin')->group(function () {
        Route::get('/reports/balances', [ReportController::class, 'balances']);
        Route::get('/reports/upcoming-gaps', [ReportController::class, 'upcomingGaps']);
        Route::get('/reports/plan-fact', [ReportController::class, 'planFact']);
        Route::get('/reports/balances/export', [ReportController::class, 'exportBalances']);
    });

    // ==========================================
    // 3. МАРШРУТЫ АДМИНИСТРАТОРА (Ограничение по роли)
    // ==========================================
    Route::middleware('role:admin')->group(function () {
        // Админ может создавать, обновлять и удалять счета
        Route::apiResource('accounts', AccountController::class)->except(['index', 'show']);
    });
});
