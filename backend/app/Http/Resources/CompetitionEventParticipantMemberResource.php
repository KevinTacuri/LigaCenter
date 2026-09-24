<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionEventParticipantMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'championship_player_id' =>
                $this->championship_player_id,

            'player' =>
                new ChampionshipPlayerListResource(
                    $this->whenLoaded('championshipPlayer')
                ),
        ];
    }
}
