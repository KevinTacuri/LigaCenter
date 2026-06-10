<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Categories",
 *     description="Gestión de categorías"
 * )
 */
class CategoryController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/categories",
     *     tags={"Categories"},
     *     summary="Listar categorías",
     *     @OA\Response(response=200, description="Listado obtenido")
     * )
     */
    public function index()
    {
        return response()->json(
            Category::with('teams')->get()
        );
    }

    /**
     * @OA\Post(
     *     path="/api/categories",
     *     tags={"Categories"},
     *     summary="Registrar categoría",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","age_range"},
     *             @OA\Property(property="name", type="string"),
     *             @OA\Property(property="age_range", type="string", example="18-25")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Categoría creada")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'age_range' => [
                'required',
                'regex:/^\d+\-\d+$/'
            ]
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/categories/{id}",
     *     tags={"Categories"},
     *     summary="Obtener categoría",
     *     @OA\Response(response=200, description="Categoría encontrada")
     * )
     */
    public function show($id)
    {
        return response()->json(
            Category::with('teams')->findOrFail($id)
        );
    }

    /**
     * @OA\Put(
     *     path="/api/categories/{id}",
     *     tags={"Categories"},
     *     summary="Actualizar categoría",
     *     @OA\Response(response=200, description="Actualizada")
     * )
     */
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'age_range' => [
                'sometimes',
                'regex:/^\d+\-\d+$/'
            ]
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * @OA\Delete(
     *     path="/api/categories/{id}",
     *     tags={"Categories"},
     *     summary="Eliminar categoría",
     *     @OA\Response(response=200, description="Eliminada")
     * )
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'Categoría eliminada correctamente'
        ]);
    }
}