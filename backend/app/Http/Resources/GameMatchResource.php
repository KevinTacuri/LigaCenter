<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameMatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'venue_id' => $this->venue_id,
            'discipline_id' => $this->discipline_id,
            'category_id' => $this->category_id,

            'local_team_id' => $this->local_team_id,
            'visitor_team_id' => $this->visitor_team_id,

            'match_date' => $this->match_date,
            'match_time' => $this->match_time,

            'round' => $this->round,
            'phase' => $this->phase,
            'group_id' => $this->group_id,

            'status' => $this->status,

            'home_score' => $this->home_score,
            'away_score' => $this->away_score,

            'venue' => $this->whenLoaded('venue'),
            'discipline' => $this->whenLoaded('discipline'),
            'category' => $this->whenLoaded('category'),
            'local_team' => new ChampionshipTeamResource($this->whenLoaded('localTeam')),
            'visitor_team' => new ChampionshipTeamResource($this->whenLoaded('visitorTeam')),

            'report' => $this->whenLoaded('report'),
            'incidences' => $this->whenLoaded('incidences'),

            'current_elapsed_time' => $this->current_elapsed_time,
            'current_period' => $this->current_period,
            'timer_status' => $this->timer_status,
            'timer_started_at' => $this->timer_started_at,

            'parent_home_match_id' => $this->parent_home_match_id,
            'parent_away_match_id' => $this->parent_away_match_id,

            'placeholder_text_home' => $this->placeholder_text_home,
            'placeholder_text_away' => $this->placeholder_text_away,

            'extra_time_minutes' => $this->extra_time_minutes,
            'has_extra_time' => $this->has_extra_time,
            'max_extra_time' => $this->max_extra_time,
        ];
    }
}