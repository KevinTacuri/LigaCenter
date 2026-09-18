<?php

namespace App\Services\Scoring;

use App\Models\GameMatch;
use App\Models\MatchIncidence;

class FootballScoreStrategy implements ScoreStrategyInterface
{
    public function applyScore(GameMatch $match, MatchIncidence $incidence): void
    {
        $points = match ($incidence->type) {
            'goal', 'penalty_goal' => ['team_id' => $incidence->championship_team_id, 'value' => 1],
            'own_goal' => ['team_id' => $this->getOpponentTeamId($match, $incidence->championship_team_id), 'value' => 1],
            default => null,
        };

        if ($points) {
            $this->addPoints($match, $points['team_id'], $points['value']);
        }
    }

    public function revertScore(GameMatch $match, MatchIncidence $incidence): void
    {
        // Útil para anulación vía VAR o borrado
        $points = match ($incidence->type) {
            'goal', 'penalty_goal' => ['team_id' => $incidence->championship_team_id, 'value' => 1],
            'own_goal' => ['team_id' => $this->getOpponentTeamId($match, $incidence->championship_team_id), 'value' => 1],
            default => null,
        };

        if ($points) {
            $this->addPoints($match, $points['team_id'], -$points['value']);
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

    private function getOpponentTeamId(GameMatch $match, int $teamId): int
    {
        return $match->home_team_id === $teamId ? $match->away_team_id : $match->home_team_id;
    }
}