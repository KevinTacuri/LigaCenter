<?php

namespace App\Services\Scoring;

use App\Models\GameMatch;
use App\Models\MatchIncidence;

interface ScoreStrategyInterface
{
    public function applyScore(GameMatch $match, MatchIncidence $incidence): void;
    public function revertScore(GameMatch $match, MatchIncidence $incidence): void;
}