<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'representative' => $this->representative,
            'logo' => $this->logo,
            'registration_status' => $this->registration_status,
            'players_count' => $this->players_count,
        ];
    }
}