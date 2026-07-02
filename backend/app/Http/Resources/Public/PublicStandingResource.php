<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicStandingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Si es un array (para equipos sin standing)
        if (is_array($this->resource)) {
            return [
                'position' => $this->resource['position'] ?? null,
                'team' => new PublicTeamResource($this->resource['team']),
                'matches_played' => $this->resource['matches_played'] ?? 0,
                'wins' => $this->resource['wins'] ?? 0,
                'draws' => $this->resource['draws'] ?? 0,
                'losses' => $this->resource['losses'] ?? 0,
                'goals_for' => $this->resource['goals_for'] ?? 0,
                'goals_against' => $this->resource['goals_against'] ?? 0,
                'goal_difference' => $this->resource['goal_difference'] ?? 0,
                'points' => $this->resource['points'] ?? 0,
                'form' => $this->resource['form'] ?? null,
            ];
        }

        // Si es un modelo Eloquent
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