<?php

namespace App\Services\Scoring;

use App\Models\GameMatch;
use App\Models\MatchIncidence;

class BasketballScoreStrategy implements ScoreStrategyInterface
{
    public function applyScore(GameMatch $match, MatchIncidence $incidence): void
    {
        // En básquetbol el tipo de incidencia define los puntos sumados
        $points = match ($incidence->type) {
            'free_throw' => 1,
            'two_pointer' => 2,
            'three_pointer' => 3,
            default => 0,
        };

        if ($points > 0) {
            $this->addPoints($match, $incidence->championship_team_id, $points);
        }
    }

    public function revertScore(GameMatch $match, MatchIncidence $incidence): void
    {
        $points = match ($incidence->type) {
            'free_throw' => 1,
            'two_pointer' => 2,
            'three_pointer' => 3,
            default => 0,
        };

        if ($points > 0) {
            $this->addPoints($match, $incidence->championship_team_id, -$points);
        }
    }

    private function addPoints(GameMatch $match, int $teamId, int $value): void
    {
        if ($match->home_team_id === $teamId) {
            $match->increment('home_score', $value);
        } elseif ($match->away_team_id === $teamId) {
            $match->increment('away_score', $value);
        }
    }
}