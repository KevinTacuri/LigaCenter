<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicMatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statusMap = [
            'programado' => 'pendiente',
            'en_curso' => 'en_vivo',
            'finalizado' => 'finalizado',
            'cancelado' => 'cancelado',
            'reprogramado' => 'reprogramado',
        ];

        return [
            'id' => $this->id,
            'home_team' => new PublicTeamResource($this->whenLoaded('localTeam')),
            'away_team' => new PublicTeamResource($this->whenLoaded('visitorTeam')),
            'home_score' => $this->home_score,
            'away_score' => $this->away_score,
            'status' => $statusMap[$this->status] ?? $this->status,
            'match_date' => $this->match_date?->format('Y-m-d'),
            'match_time' => $this->match_time,
            'datetime' => $this->match_date && $this->match_time 
                ? $this->match_date->format('Y-m-d') . 'T' . $this->match_time 
                : null,
            'venue' => $this->whenLoaded('venue', function () {
                return [
                    'id' => $this->venue->id,
                    'name' => $this->venue->name,
                    'location' => $this->venue->location,
                ];
            }),
            'championship' => [
                'id' => $this->championship?->id,
                'name' => $this->championship?->name,
            ],
            'group' => $this->whenLoaded('group', function () {
                return $this->group ? [
                    'id' => $this->group->id,
                    'name' => $this->group->name,
                ] : null;
            }),
            'round' => $this->round,
            'phase' => $this->phase,
        ];
    }
}