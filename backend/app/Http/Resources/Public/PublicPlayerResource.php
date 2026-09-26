<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicPlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->player->names . ' ' . $this->player->last_names,
            'photo' => $this->player->photo ? asset($this->player->photo) : null,
            'jersey_number' => $this->number,
            // ⚠️ NO incluimos document_number (DNI) por seguridad
            // ⚠️ NO incluimos birth_date (fecha de nacimiento) por privacidad
        ];
    }
}