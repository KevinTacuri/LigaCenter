<?php

namespace AppHttpResources;

use IlluminateHttpRequest;
use IlluminateHttpResourcesJsonJsonResource;

class PublicPlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => trim($this->names . ' ' . $this->last_names),
            'names' => $this->names,
            'last_names' => $this->last_names,
            'photo' => $this->photo,
            'jersey_number' => $this->pivot?->jersey_number,
            'teams' => PublicTeamResource::collection($this->whenLoaded('teams')),
        ];
    }
}
