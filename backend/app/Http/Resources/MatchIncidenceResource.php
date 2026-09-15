<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchIncidenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'match_id' => $this->match_id,
            'player_id' => $this->championship_player_id,
            'team_id' => $this->championship_team_id,
            'incidence_type' => $this->incidence_type,
            'minute' => $this->minute,
            'second' => $this->second,
            'description' => $this->description,

            'player' => $this->whenLoaded(
                'player',
                fn () => $this->player
                    ? new ChampionshipPlayerListResource($this->player)
                    : null
            ),
        ];
    }
}