<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/api/reset-password', [AuthController::class, 'resetPassword']);

// Ruta requerida por el password broker de Laravel para generar los correos
Route::get('/reset-password/{token}', function ($token) {
    $email = request('email');
    return redirect("http://localhost:5173/restablecer-contrasenia?token={$token}&email={$email}");
})->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/api/logout', [AuthController::class, 'logout']);
    Route::get('/api/me', [AuthController::class, 'me']);
});