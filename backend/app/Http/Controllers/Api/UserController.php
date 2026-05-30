<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $users = User::with('roles')->paginate(15);

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

    public function getRoles(): JsonResponse
    {
        $roles = Role::where('name', '!=', 'usuario_publico')->get(['name', 'id']);

        return $this->successResponse($roles, 'Roles obtenidos exitosamente');
    }
}