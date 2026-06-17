<?php

namespace App\Services;

use App\Models\Team;
use App\Models\GameMatch;
use App\Models\Category;
use Carbon\Carbon;

class FixtureService
{
    protected $groupStageService;
    protected $knockoutService;

    public function __construct(
        GroupStageService $groupStageService,
        KnockoutService $knockoutService
    ) {
        $this->groupStageService = $groupStageService;
        $this->knockoutService = $knockoutService;
    }

    public function generateFixture($championshipId, $categoryId, $startDate, $venueIds)
    {
        $category = Category::find($categoryId);

        if (!$category) {
            throw new \Exception('Categoría no encontrada');
        }

        $format = $category->format ?? 'liga';
        $settings = $category->format_settings ?? [];

        switch ($format) {
            case 'grupos':
                $result = $this->groupStageService->generateGroups(
                    $championshipId,
                    $categoryId,
                    $settings,
                    $startDate,
                    $venueIds
                );

                $advancePerGroup = $settings['advance_per_group'] ?? 2;
                $thirdPlace = $settings['third_place'] ?? false;

                $qualified = $this->groupStageService->getQualifiedTeams(
                    $championshipId,
                    $categoryId,
                    $advancePerGroup
                );

                if ($qualified->count() >= 2) {
                    $this->knockoutService->generateKnockout(
                        $championshipId,
                        $categoryId,
                        $qualified,
                        Carbon::parse($startDate)->addDays(14)->toDateString(),
                        $venueIds,
                        $thirdPlace
                    );
                }

                return $result;

            case 'eliminacion_directa':
                $teams = Team::where('championship_id', $championshipId)
                    ->where('category_id', $categoryId)
                    ->where('registration_status', 'aprobado')
                    ->get();

                return $this->knockoutService->generateKnockout(
                    $championshipId,
                    $categoryId,
                    $teams,
                    $startDate,
                    $venueIds,
                    $settings['third_place'] ?? false
                );

            case 'liga':
            default:
                return $this->generateRoundRobin($championshipId, $categoryId, $startDate, $venueIds);
        }
    }

    public function generateRoundRobin($championshipId, $categoryId, $startDate, $venueIds)
    {
        $teams = Team::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('registration_status', 'aprobado')
            ->get();

        if ($teams->count() < 2) {
            throw new \Exception('Se necesitan al menos 2 equipos');
        }

        $teamIds = $teams->pluck('id')->toArray();
        $rounds = [];

        if (count($teamIds) % 2 != 0) {
            $teamIds[] = null;
        }

        $n = count($teamIds);
        $half = $n / 2;
        $roundsCount = $n - 1;

        for ($round = 0; $round < $roundsCount; $round++) {
            $roundMatches = [];
            for ($i = 0; $i < $half; $i++) {
                $local = $teamIds[$i];
                $visitor = $teamIds[$n - 1 - $i];

                if ($local !== null && $visitor !== null) {
                    if ($round % 2 == 0) {
                        $roundMatches[] = ['local' => $local, 'visitor' => $visitor];
                    } else {
                        $roundMatches[] = ['local' => $visitor, 'visitor' => $local];
                    }
                }
            }
            $rounds[] = $roundMatches;
            array_splice($teamIds, 1, 0, array_pop($teamIds));
        }

        $secondRound = [];
        foreach ($rounds as $roundMatches) {
            $reversedMatches = [];
            foreach ($roundMatches as $match) {
                $reversedMatches[] = ['local' => $match['visitor'], 'visitor' => $match['local']];
            }
            $secondRound[] = $reversedMatches;
        }

        $allRounds = array_merge($rounds, $secondRound);
        $date = Carbon::parse($startDate);
        $matchesCreated = [];

        $venues = array_values($venueIds);
        $venueCount = count($venues);
        $venueIndex = 0;

        foreach ($allRounds as $roundIndex => $roundMatches) {
            foreach ($roundMatches as $match) {
                $matchData = [
                    'championship_id' => $championshipId,
                    'category_id' => $categoryId,
                    'home_team_id' => $match['local'],
                    'away_team_id' => $match['visitor'],
                    'venue_id' => $venueCount > 0 ? $venues[$venueIndex % $venueCount] : null,
                    'round' => $roundIndex + 1,
                    'phase' => 'liga',
                    'match_date' => $date->copy()->addDays($roundIndex * 7)->toDateString(),
                    'status' => 'programado',
                ];
                $matchesCreated[] = GameMatch::create($matchData);
                $venueIndex++;
            }
        }

        return $matchesCreated;
    }

    public function getFixture($championshipId, $categoryId)
    {
        return GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'group'])
            ->where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->orderBy('round')
            ->orderBy('match_date')
            ->get();
    }
}