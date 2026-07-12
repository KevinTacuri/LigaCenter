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
            'category' => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'gender_type' => $this->category->gender_type,
            ] : null,
            'discipline' => ($this->category && $this->category->championshipDiscipline && $this->category->championshipDiscipline->discipline) ? [
                'id' => $this->category->championshipDiscipline->discipline->id,
                'name' => $this->category->championshipDiscipline->discipline->name,
            ] : null,
        ];
    }
}