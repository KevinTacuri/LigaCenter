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
            'delegate' => ($this->relationLoaded('championshipUser') && $this->championshipUser && $this->championshipUser->user) ? [
                'id' => $this->championshipUser->user->id,
                'name' => $this->championshipUser->user->name,
                'email' => $this->championshipUser->user->email,
            ] : null,
            'logo' => $this->logo,
            'registration_status' => $this->registration_status,
            'players_count' => $this->players_count,
            'category' => $this->when(
                $this->relationLoaded('latestChampionshipTeam') &&
                $this->latestChampionshipTeam?->category,
                function () {
                    $category = $this->latestChampionshipTeam->category;

                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'gender_type' => $category->gender_type,
                    ];
                }
            ),
            'discipline' => ($this->discipline) ? [
                'id' => $this->discipline->id,
                'name' => $this->discipline->name,
            ] : null,
        ];
    }
}