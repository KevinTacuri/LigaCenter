<?php

namespace App\Http\Controllers\Public;

use App\Models\Discipline;
use App\Http\Resources\Public\PublicDisciplineResource;

class PublicDisciplineController extends PublicController
{
    public function index()
    {
        $disciplines = Discipline::whereHas('championships', function ($query) {
            $query->where('is_public', true);
        })->orderBy('name')->get();

        return $this->successResponse(
            PublicDisciplineResource::collection($disciplines),
            'Disciplinas obtenidas exitosamente'
        );
    }
}