<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/users',
        operationId: 'getUsers',
        summary: 'Listar usuarios',
        description: 'Obtiene una lista paginada de usuarios con sus roles.',
        tags: ['Usuarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Response(
        response: 200,
        description: 'Usuarios obtenidos exitosamente'
    )]
    public function index(Request $request): JsonResponse
    {
        $query = User::whereHas('roles', function($q) {
            $q->where('name', '!=', 'usuario_publico');
        })->with('roles');

        if ($request->boolean('exclude_privileged') || $request->has('exclude_roles')) {
            $excluded = explode(',', $request->query('exclude_roles', 'administrador,organizador'));
            $query->whereDoesntHave('roles', function($q) use ($excluded) {
                $q->whereIn('name', $excluded);
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $users = $query->paginate($perPage);

        return $this->successResponse([
            'users' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ], 'Usuarios obtenidos exitosamente');
    }

    #[OA\Get(
        path: '/api/users/{id}',
        operationId: 'getUserById',
        summary: 'Obtener usuario',
        description: 'Obtiene la información detallada de un usuario.',
        tags: ['Usuarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        description: 'ID del usuario',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Usuario encontrado')]
    #[OA\Response(response: 404, description: 'Usuario no encontrado')]
    public function show($id): JsonResponse
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado', 404);
        }

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'dni' => $user->dni,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ], 'Usuario obtenido exitosamente');
    }

    #[OA\Put(
        path: '/api/users/{id}',
        operationId: 'updateUser',
        summary: 'Actualizar usuario',
        description: 'Actualiza la información de un usuario.',
        tags: ['Usuarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: false,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Juan Pérez'),
                new OA\Property(property: 'email', type: 'string', example: 'juan@gmail.com'),
                new OA\Property(property: 'dni', type: 'string', example: '12345678'),
                new OA\Property(property: 'phone', type: 'string', example: '987654321'),
                new OA\Property(property: 'password', type: 'string', example: 'Password123'),
                new OA\Property(property: 'is_active', type: 'boolean', example: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Usuario actualizado exitosamente')]
    #[OA\Response(response: 404, description: 'Usuario no encontrado')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado', 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'dni' => 'sometimes|string|max:20|unique:users,dni,' . $id,
            'phone' => 'sometimes|string|max:20',
            'password' => 'sometimes|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('dni')) {
            $user->dni = $request->dni;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }
        if ($request->has('is_active')) {
            $user->is_active = $request->is_active;
        }

        $user->save();

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'dni' => $user->dni,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
        ], 'Usuario actualizado exitosamente');
    }

    #[OA\Put(
        path: '/api/users/{id}/role',
        operationId: 'changeUserRole',
        summary: 'Cambiar rol de usuario',
        description: 'Actualiza el rol asignado a un usuario.',
        tags: ['Usuarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['role'],
            properties: [
                new OA\Property(
                    property: 'role',
                    type: 'string',
                    example: 'administrador'
                )
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Rol actualizado exitosamente')]
    #[OA\Response(response: 404, description: 'Usuario no encontrado')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function changeRole(Request $request, $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado', 404);
        }

        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->syncRoles([$request->role]);

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'roles' => $user->getRoleNames(),
        ], 'Rol actualizado exitosamente');
    }

    #[OA\Delete(
        path: '/api/users/{id}',
        operationId: 'deleteUser',
        summary: 'Eliminar usuario',
        description: 'Elimina un usuario del sistema.',
        tags: ['Usuarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Usuario eliminado exitosamente')]
    #[OA\Response(response: 400, description: 'No puedes eliminarte a ti mismo')]
    #[OA\Response(response: 404, description: 'Usuario no encontrado')]
    public function destroy($id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado', 404);
        }

        if ($user->id === auth()->id()) {
            return $this->errorResponse('No puedes eliminarte a ti mismo', 400);
        }

        $user->delete();

        return $this->successResponse(null, 'Usuario eliminado exitosamente');
    }

    #[OA\Get(
        path: '/api/roles',
        operationId: 'getRoles',
        summary: 'Listar roles',
        description: 'Obtiene los roles disponibles del sistema.',
        tags: ['Roles']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Response(
        response: 200,
        description: 'Roles obtenidos exitosamente'
    )]
    public function getRoles(): JsonResponse
    {
        $roles = Role::where('name', '!=', 'usuario_publico')->get(['name', 'id']);

        return $this->successResponse($roles, 'Roles obtenidos exitosamente');
    }
}