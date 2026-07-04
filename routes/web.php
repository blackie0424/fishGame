<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\FishImageAnalyzerController;
use App\Http\Controllers\GameConfigController;
use Illuminate\Support\Facades\Route;

// ---------- 遊戲前台 ----------
Route::view('/', 'game')->name('game');
Route::get('/api/game-config', GameConfigController::class)->name('game.config');

// ---------- 後台 ----------
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.post');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('admin.auth')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::post('fish/analyze-image', [FishImageAnalyzerController::class, 'analyze'])->name('fish.analyze');
        Route::get('{entity}', [AdminController::class, 'index'])->name('index');
        Route::get('{entity}/create', [AdminController::class, 'edit'])->name('create');
        Route::get('{entity}/{id}/edit', [AdminController::class, 'edit'])->name('edit');
        Route::post('{entity}/save/{id?}', [AdminController::class, 'save'])->name('save');
        Route::post('{entity}/{id}/delete', [AdminController::class, 'destroy'])->name('delete');
    });
});
