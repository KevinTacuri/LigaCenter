<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@ligacenter.com'],
            [
                'name' => 'Administrador',
                'dni' => '12345678',
                'phone' => '999999999',
                'password' => Hash::make('12345678'),
                'is_active' => true,
            ]
        );
        $admin->assignRole('administrador');

        $organizador = User::firstOrCreate(
            ['email' => 'organizador@ligacenter.com'],
            [
                'name' => 'Organizador',
                'dni' => '87654321',
                'phone' => '888888888',
                'password' => Hash::make('12345678'),
                'is_active' => true,
            ]
        );
        $organizador->assignRole('organizador');

        $encargadoMesa = User::firstOrCreate(
            ['email' => 'mesa@ligacenter.com'],
            [
                'name' => 'Encargado Mesa',
                'dni' => '11111111',
                'phone' => '777777777',
                'password' => Hash::make('12345678'),
                'is_active' => true,
            ]
        );
        $encargadoMesa->assignRole('encargado_mesa');

        $usuarioPublico = User::firstOrCreate(
            ['email' => 'publico@ligacenter.com'],
            [
                'name' => 'Usuario Publico',
                'dni' => '22222222',
                'phone' => '666666666',
                'password' => Hash::make('12345678'),
                'is_active' => true,
            ]
        );
        $usuarioPublico->assignRole('usuario_publico');
    }
}