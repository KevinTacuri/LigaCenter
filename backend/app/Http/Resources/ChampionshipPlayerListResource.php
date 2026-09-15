<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChampionshipPlayerListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->player->name,
            'dni' => $this->player->dni,
            'phone' => $this->player->phone,

            'team_id' => $this->championship_team_id,

            'number' => $this->jersey_number,
            'position' => $this->position,

            'photo' => $this->player->photo,

            'birth_date' => $this->player->birth_date,

            'team' => new ChampionshipTeamListResource(
                $this->whenLoaded('championshipTeam')
            ),
        ];
    }
}