<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Standing;

class StandingService
{
    private function getDisciplineName(GameMatch $match): string
    {
        $discipline = $match->discipline;
        if (!$discipline) {
            return 'futbol';
        }
        $name = strtolower($discipline->name);
        if (str_contains($name, 'voley') || str_contains($name, 'voleibol') || str_contains($name, 'volleyball')) {
            return 'voley';
        }
        if (str_contains($name, 'basquet') || str_contains($name, 'basketball') || str_contains($name, 'baloncesto')) {
            return 'basquet';
        }
        if (str_contains($name, 'balon mano') || str_contains($name, 'balonmano') || str_contains($name, 'handball')) {
            return 'balonmano';
        }
        return 'futbol';
    }

    public function updateFromMatch(GameMatch $match, int $localScore, int $visitorScore)
    {
        $discipline = $this->getDisciplineName($match);

        $localStanding = Standing::firstOrCreate(
            [
                'championship_team_id' => $match->local_team_id,
                'championship_id' => $match->championship_id,
                'category_id' => $match->category_id,
            ],
            $this->getDefaultStandingData()
        );

        $visitorStanding = Standing::firstOrCreate(
            [
                'championship_team_id' => $match->visitor_team_id,
                'championship_id' => $match->championship_id,
                'category_id' => $match->category_id,
            ],
            $this->getDefaultStandingData()
        );

        $localStanding->matches_played++;
        $visitorStanding->matches_played++;

        $this->updateStandingByDiscipline($localStanding, $visitorStanding, $localScore, $visitorScore, $discipline);

        $localStanding->last_updated = now();
        $visitorStanding->last_updated = now();

        $localStanding->save();
        $visitorStanding->save();

        return [
            'local' => $localStanding,
            'visitor' => $visitorStanding,
        ];
    }

    private function getDefaultStandingData(): array
    {
        return [
            'matches_played' => 0,
            'points' => 0,
            'wins' => 0,
            'draws' => 0,
            'losses' => 0,
            'goals_for' => 0,
            'goals_against' => 0,
            'goal_difference' => 0,
            'wins_total' => 0,
            'losses_total' => 0,
            'sets_for' => 0,
            'sets_against' => 0,
            'sets_ratio' => 0,
            'points_for' => 0,
            'points_against' => 0,
            'points_ratio' => 0,
            'win_percentage' => 0,
            'games_behind' => 0,
            'streak' => null,
        ];
    }

    private function updateStandingByDiscipline(
        Standing $local,
        Standing $visitor,
        int $localScore,
        int $visitorScore,
        string $discipline
    ): void {
        if ($discipline === 'futbol' || $discipline === 'balonmano') {
            $this->updateFutbolStanding($local, $visitor, $localScore, $visitorScore);
        } elseif ($discipline === 'voley') {
            $this->updateVoleyStanding($local, $visitor, $localScore, $visitorScore);
        } elseif ($discipline === 'basquet') {
            $this->updateBasquetStanding($local, $visitor, $localScore, $visitorScore);
        }
    }

    private function updateFutbolStanding(
        Standing $local,
        Standing $visitor,
        int $localScore,
        int $visitorScore
    ): void {
        $local->goals_for += $localScore;
        $local->goals_against += $visitorScore;
        $visitor->goals_for += $visitorScore;
        $visitor->goals_against += $localScore;

        if ($localScore > $visitorScore) {
            $local->wins++;
            $local->points += 3;
            $visitor->losses++;
        } elseif ($localScore < $visitorScore) {
            $visitor->wins++;
            $visitor->points += 3;
            $local->losses++;
        } else {
            $local->draws++;
            $visitor->draws++;
            $local->points += 1;
            $visitor->points += 1;
        }

        $local->goal_difference = $local->goals_for - $local->goals_against;
        $visitor->goal_difference = $visitor->goals_for - $visitor->goals_against;
    }

    private function updateVoleyStanding(
        Standing $local,
        Standing $visitor,
        int $localScore,
        int $visitorScore
    ): void {
        $setsLocal = $localScore;
        $setsVisitor = $visitorScore;

        $local->sets_for += $setsLocal;
        $local->sets_against += $setsVisitor;
        $visitor->sets_for += $setsVisitor;
        $visitor->sets_against += $setsLocal;

        $local->points_for += $localScore * 25;
        $local->points_against += $visitorScore * 25;
        $visitor->points_for += $visitorScore * 25;
        $visitor->points_against += $localScore * 25;

        if ($setsLocal > $setsVisitor) {
            if ($setsLocal >= 3 && $setsVisitor <= 1) {
                $local->points += 3;
            } else {
                $local->points += 2;
            }
            $local->wins_total++;
            $visitor->losses_total++;
            if ($setsVisitor >= 2) {
                $visitor->points += 1;
            }
        } else {
            if ($setsVisitor >= 3 && $setsLocal <= 1) {
                $visitor->points += 3;
            } else {
                $visitor->points += 2;
            }
            $visitor->wins_total++;
            $local->losses_total++;
            if ($setsLocal >= 2) {
                $local->points += 1;
            }
        }

        $local->sets_ratio = $local->sets_against > 0 
            ? round($local->sets_for / $local->sets_against, 3) 
            : $local->sets_for;
        $visitor->sets_ratio = $visitor->sets_against > 0 
            ? round($visitor->sets_for / $visitor->sets_against, 3) 
            : $visitor->sets_for;

        $local->points_ratio = $local->points_against > 0 
            ? round($local->points_for / $local->points_against, 3) 
            : $local->points_for;
        $visitor->points_ratio = $visitor->points_against > 0 
            ? round($visitor->points_for / $visitor->points_against, 3) 
            : $visitor->points_for;
    }

    private function updateBasquetStanding(
        Standing $local,
        Standing $visitor,
        int $localScore,
        int $visitorScore
    ): void {
        $local->points_for += $localScore;
        $local->points_against += $visitorScore;
        $visitor->points_for += $visitorScore;
        $visitor->points_against += $localScore;

        if ($localScore > $visitorScore) {
            $local->wins_total++;
            $local->points += 2;
            $visitor->losses_total++;
            $visitor->points += 1;
        } else {
            $visitor->wins_total++;
            $visitor->points += 2;
            $local->losses_total++;
            $local->points += 1;
        }

        $totalLocal = $local->wins_total + $local->losses_total;
        $totalVisitor = $visitor->wins_total + $visitor->losses_total;

        $local->win_percentage = $totalLocal > 0 
            ? round(($local->wins_total / $totalLocal) * 100, 2) 
            : 0;
        $visitor->win_percentage = $totalVisitor > 0 
            ? round(($visitor->wins_total / $totalVisitor) * 100, 2) 
            : 0;
    }

    public function recalculateAllForCategory(int $championshipId, int $categoryId): void
    {
        $matches = GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('status', 'finalizado')
            ->get();

        Standing::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->delete();

        foreach ($matches as $match) {
            $localScore = $match->home_score ?? 0;
            $visitorScore = $match->away_score ?? 0;
            $this->updateFromMatch($match, $localScore, $visitorScore);
        }
    }

    public function getFormattedStandings(int $championshipId, int $categoryId, ?int $disciplineId = null): array
    {
        $query = Standing::with(['team', 'category'])
            ->where('championship_id', $championshipId)
            ->where('category_id', $categoryId);

        $standings = $query->get();

        $discipline = null;
        if ($standings->isNotEmpty() && $standings->first()->category) {
            $discipline = $standings->first()->category->championshipDiscipline?->discipline;
        }

        $disciplineName = $discipline ? strtolower($discipline->name) : 'futbol';

        return [
            'standings' => $standings,
            'discipline' => $disciplineName,
            'is_knockout' => $this->isKnockoutFormat($standings),
        ];
    }

    private function isKnockoutFormat($standings): bool
    {
        if ($standings->isEmpty()) {
            return false;
        }
        $category = $standings->first()->category;
        return $category && $category->format === 'eliminacion_directa';
    }
}