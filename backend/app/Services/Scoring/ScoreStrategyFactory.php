<?php

namespace App\Services\Scoring;

use App\Enums\DisciplineSlug;
use InvalidArgumentException;

class ScoreStrategyFactory
{
    public static function make(string|DisciplineSlug $discipline): ScoreStrategyInterface
    {
        $disciplineEnum = is_string($discipline) ? DisciplineSlug::tryFrom($discipline) : $discipline;

        return match ($disciplineEnum) {
            // Football strat
            DisciplineSlug::FULBITO,
            DisciplineSlug::FOOTBALL_11,
            DisciplineSlug::FOOTBALL_8,
            DisciplineSlug::HOCKEY,
            DisciplineSlug::HANDBALL,
            DisciplineSlug::BEACH_HANDBALL => new FootballScoreStrategy(),

            // Basquet strat
            DisciplineSlug::BASKETBALL,
            DisciplineSlug::BASKETBALL_3X3 => new BasketballScoreStrategy(),

            // Volleyball strat
            //DisciplineSlug::VOLLEYBALL,
            //DisciplineSlug::BEACH_VOLLEYBALL => new VolleyballScoreStrategy(),

            // Racket / Chess Games / Direct Points strat
            //DisciplineSlug::TABLE_TENNIS,
            //DisciplineSlug::FRONTON,
            //DisciplineSlug::CHESS,
            //DisciplineSlug::TIRO_AL_SAPO => new PointBasedScoreStrategy(),

            // DisciplineSlug::VOLLEYBALL => new VolleyballScoreStrategy(),
            default => throw new InvalidArgumentException("Disciplina no soportada: {$discipline}"),
        };
    }
}