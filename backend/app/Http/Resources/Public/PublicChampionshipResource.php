<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicChampionshipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'disciplines' => PublicDisciplineResource::collection($this->whenLoaded('disciplines')),
            'teams_count' => $this->whenCounted('championshipTeams', $this->teams_count ?? 0),
            'matches_count' => $this->whenCounted('matches', $this->matches_count ?? 0),
            'is_public' => $this->is_public,
        ];
    }
}