<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permisos = [
            'ver_dashboard',
            'gestionar_usuarios',
            'cambiar_rol_usuario',
            'ver_equipos',
            'crear_equipos',
            'editar_equipos',
            'eliminar_equipos',
            'ver_jugadores',
            'crear_jugadores',
            'editar_jugadores',
            'eliminar_jugadores',
            'importar_jugadores',
            'ver_disciplinas',
            'configurar_disciplinas',
            'ver_categorias',
            'configurar_categorias',
            'ver_escenarios',
            'gestionar_escenarios',
            'programar_partidos',
            'reprogramar_partidos',
            'registrar_incidencias',
            'editar_incidencias',
            'cerrar_partido',
            'anular_cierre',
            'gestionar_sanciones',
            'ver_tablas',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate([
                'name' => $permiso,
                'guard_name' => 'web',
            ]);
        }

        $administrador = Role::firstOrCreate(['name' => 'administrador']);
        $administrador->syncPermissions(Permission::all());

        $organizador = Role::firstOrCreate(['name' => 'organizador']);
        $organizador->syncPermissions([
            'ver_dashboard',
            'ver_equipos',
            'crear_equipos',
            'editar_equipos',
            'eliminar_equipos',
            'ver_jugadores',
            'crear_jugadores',
            'editar_jugadores',
            'eliminar_jugadores',
            'importar_jugadores',
            'ver_disciplinas',
            'configurar_disciplinas',
            'ver_categorias',
            'configurar_categorias',
            'ver_escenarios',
            'gestionar_escenarios',
            'programar_partidos',
            'reprogramar_partidos',
            'ver_tablas',
        ]);

        $encargadoMesa = Role::firstOrCreate(['name' => 'encargado_mesa']);
        $encargadoMesa->syncPermissions([
            'ver_dashboard',
            'ver_equipos',
            'ver_jugadores',
            'registrar_incidencias',
            'editar_incidencias',
            'cerrar_partido',
            'ver_tablas',
        ]);

        $usuarioPublico = Role::firstOrCreate(['name' => 'usuario_publico']);
        $usuarioPublico->syncPermissions([
            'ver_dashboard',
            'ver_equipos',
            'ver_jugadores',
            'ver_tablas',
        ]);
    }
}