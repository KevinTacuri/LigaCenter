<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicStandingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'position' => $this->position ?? null,
            'team' => new PublicTeamResource($this->whenLoaded('team')),
            'matches_played' => $this->matches_played,
            'wins' => $this->wins,
            'draws' => $this->draws,
            'losses' => $this->losses,
            'goals_for' => $this->goals_for,
            'goals_against' => $this->goals_against,
            'goal_difference' => $this->goal_difference,
            'points' => $this->points,
            'form' => $this->form ?? null,
        ];
    }
}