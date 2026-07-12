<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'representative' => $this->representative,
            'delegate' => ($this->relationLoaded('championshipUser') && $this->championshipUser && $this->championshipUser->user) ? [
                'id' => $this->championshipUser->user->id,
                'name' => $this->championshipUser->user->name,
                'email' => $this->championshipUser->user->email,
            ] : null,
            'name' => $this->name,
            'logo' => $this->logo,
            'description' => $this->description,
            'registration_status' => $this->registration_status,

            'category' => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'gender_type' => $this->category->gender_type,
            ],

            'discipline' => [
                'id' => $this->category->championshipDiscipline->discipline->id,
                'name' => $this->category->championshipDiscipline->discipline->name,
            ],

            'players' => PlayerResource::collection($this->whenLoaded('players')),
        ];
    }
}