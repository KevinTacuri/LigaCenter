<?php

namespace App\Services;

use App\Models\MatchIncidence;
use App\Models\Sanction;
use Carbon\Carbon;

class SanctionService
{
    public function generateAutomaticSanctions($matchId)
    {
        $incidences = MatchIncidence::where('match_id', $matchId)->get();
        $sanctionsCreated = [];

        foreach ($incidences as $incidence) {
            if ($incidence->incidence_type === 'red_card' && $incidence->player_id) {
                $existingSanction = Sanction::where('player_id', $incidence->player_id)
                    ->where('match_id', $matchId)
                    ->where('sanction_type', 'Suspension')
                    ->first();

                if (!$existingSanction) {
                    $sanction = Sanction::create([
                        'player_id' => $incidence->player_id,
                        'match_id' => $matchId,
                        'sanction_type' => 'Suspension',
                        'reason' => 'Suspensión automática por tarjeta roja',
                        'start_date' => Carbon::now(),
                        'end_date' => Carbon::now()->addDays(1),
                        'matches_suspended' => 1,
                        'status' => 'activa',
                    ]);

                    $sanctionsCreated[] = $sanction;
                }
            }

            if ($incidence->incidence_type === 'yellow_card' && $incidence->player_id) {
                $yellowCount = MatchIncidence::where('player_id', $incidence->player_id)
                    ->where('incidence_type', 'yellow_card')
                    ->count();

                if ($yellowCount >= 2) {
                    $existingSanction = Sanction::where('player_id', $incidence->player_id)
                        ->where('sanction_type', 'yellow_accumulation')
                        ->whereNull('end_date')
                        ->first();

                    if (!$existingSanction) {
                        $sanction = Sanction::create([
                            'player_id' => $incidence->player_id,
                            'match_id' => $matchId,
                            'sanction_type' => 'yellow_accumulation',
                            'reason' => 'Acumulación de tarjetas amarillas',
                            'start_date' => Carbon::now(),
                            'end_date' => Carbon::now()->addDays(1),
                            'matches_suspended' => 1,
                            'status' => 'activa',
                        ]);

                        $sanctionsCreated[] = $sanction;
                    }
                }
            }
        }

        return $sanctionsCreated;
    }
}