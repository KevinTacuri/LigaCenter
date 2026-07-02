<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicTeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Si es un array
        if (is_array($this->resource)) {
            return [
                'id' => $this->resource['id'] ?? null,
                'name' => $this->resource['name'] ?? null,
                'logo' => $this->resource['logo'] ?? null,
            ];
        }

        // Si es un modelo Eloquent
        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo' => $this->logo ?? $this->logo_url ?? null,
        ];
    }
}