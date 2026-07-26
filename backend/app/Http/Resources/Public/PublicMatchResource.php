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

        $elapsedTime = null;
        if ($this->status === 'en_curso' && $this->current_elapsed_time !== null) {
            $elapsedTime = $this->current_elapsed_time;
            if ($this->timer_started_at && $this->timer_status === 'running') {
                $start = new \DateTime($this->timer_started_at);
                $now = new \DateTime();
                $diff = $now->getTimestamp() - $start->getTimestamp();
                $elapsedTime = ($this->current_elapsed_time ?? 0) + $diff;
            }
        }

        return [
            'id' => $this->id,
            'home_team' => new PublicTeamResource($this->whenLoaded('localTeam')),
            'away_team' => new PublicTeamResource($this->whenLoaded('visitorTeam')),
            'home_score' => $this->home_score ?? null,
            'away_score' => $this->away_score ?? null,
            'status' => $statusMap[$this->status] ?? $this->status,
            'match_date' => $this->match_date?->format('Y-m-d'),
            'match_time' => $this->match_time,
            'datetime' => $this->match_date && $this->match_time 
                ? $this->match_date->format('Y-m-d') . 'T' . $this->match_time 
                : null,
            'elapsed_time' => $elapsedTime,
            'timer_status' => $this->timer_status ?? 'stopped',
            'current_period' => $this->current_period ?? 1,
            'category_id' => $this->category_id,
            'discipline_id' => $this->discipline_id,
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
            'discipline' => $this->whenLoaded('championship.disciplines', function () {
                return $this->championship?->disciplines?->first() ? [
                    'id' => $this->championship->disciplines->first()->id,
                    'name' => $this->championship->disciplines->first()->name,
                ] : null;
            }),
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