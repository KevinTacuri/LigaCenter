<?php

namespace App\Http\Controllers\Public;

use App\Models\Category;
use App\Http\Resources\Public\PublicCategoryResource;
use Illuminate\Http\Request;

class PublicCategoryController extends PublicController
{
    public function index(Request $request)
    {
        $disciplineId = $request->get('discipline_id');

        $query = Category::whereHas('championshipDiscipline', function ($q) {
            $q->whereHas('championship', function ($query) {
                $query->where('is_public', true);
            });
        });

        if ($disciplineId) {
            $query->whereHas('championshipDiscipline', function ($q) use ($disciplineId) {
                $q->where('discipline_id', $disciplineId);
            });
        }

        $categories = $query->with(['championshipDiscipline.discipline'])->get();

        return $this->successResponse(
            PublicCategoryResource::collection($categories),
            'Categorías obtenidas exitosamente'
        );
    }
}