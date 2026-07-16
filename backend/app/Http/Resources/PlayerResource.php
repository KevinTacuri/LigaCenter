<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dni' => $this->document_number,
            'names' => $this->names,
            'last_names' => $this->last_names,
            'photo' => $this->photo,

            'jersey_number' => $this->pivot?->jersey_number,
            'status' => $this->pivot?->status,
        ];
    }
}