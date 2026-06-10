<?php

namespace App\Services;

use App\Models\MatchIncidence;
use App\Models\Sanction;

class SanctionService
{
    public function generateAutomaticSanctions($matchId)
    {
        $incidences = MatchIncidence::where(
            'match_id',
            $matchId
        )->get();

        $sanctionsCreated = [];

        foreach ($incidences as $incidence) {

            if (
                $incidence->incidence_type === 'red_card'
                && $incidence->player_id
            ) {

                $sanction = Sanction::create([
                    'player_id' => $incidence->player_id,
                    'origin_match_id' => $matchId,
                    'sanction_type' => 'Suspension',
                    'reason' => 'Automatic suspension due to red card',
                    'start_date' => now(),
                    'duration' => 1,
                    'status' => 'active',
                ]);

                $sanctionsCreated[] = $sanction;
            }
        }

        return $sanctionsCreated;
    }
}