<?php

namespace App\Http\Resources;

use IlluminateHttpRequest;
use IlluminateHttpResourcesJsonJsonResource;

class PublicTeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo' => $this->logo,
            'description' => $this->description,
            'championship_id' => $this->championship_id,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'gender_type' => $this->category->gender_type,
            ]),
            'players_count' => $this->whenCounted('players'),
            'players' => PublicPlayerResource::collection($this->whenLoaded('players')),
        ];
    }
}
