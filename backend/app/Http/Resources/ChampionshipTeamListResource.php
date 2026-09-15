<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChampionshipTeamListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->team->name,
            'representative' => $this->representative,
            'delegate' => ($this->relationLoaded('championshipUser') && $this->championshipUser && $this->championshipUser->user) ? [
                'id' => $this->championshipUser->user->id,
                'name' => $this->championshipUser->user->name,
                'email' => $this->championshipUser->user->email,
            ] : null,
            'logo' => $this->team->logo,
            'registration_status' => $this->registration_status,
            'players_count' => $this->players_count,
            'category' => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'gender_type' => $this->category->gender_type,
            ] : null,
            'discipline' => ($this->team->discipline) ? [
                'id' => $this->team->discipline->id,
                'name' => $this->team->discipline->name,
            ] : null,
        ];
    }
}