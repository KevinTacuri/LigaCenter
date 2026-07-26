<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'format' => $this->format,
            'format_settings' => $this->format_settings,
            'description' => $this->description,
            'gender_type' => $this->gender_type,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'championship_discipline_id' => $this->championship_discipline_id,
            'discipline_id' => $this->championshipDiscipline?->discipline_id,
            'discipline_name' => $this->championshipDiscipline?->discipline?->name,
        ];
    }
}