<?php

namespace App\Services;

use App\Models\Team;
use App\Models\GameMatch;
use Carbon\Carbon;

class FixtureService
{
    public function generateRoundRobin($disciplineId, $categoryId, $startDate, $venueIds)
    {
        $teams = Team::where('discipline_id', $disciplineId)
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

        foreach ($allRounds as $roundIndex => $roundMatches) {
            foreach ($roundMatches as $match) {
                $matchData = [
                    'discipline_id' => $disciplineId,
                    'category_id' => $categoryId,
                    'local_team_id' => $match['local'],
                    'visitor_team_id' => $match['visitor'],
                    'round' => $roundIndex + 1,
                    'match_date' => $date->copy()->addDays($roundIndex * 7)->toDateString(),
                    'status' => 'programado',
                ];
                $matchesCreated[] = GameMatch::create($matchData);
            }
        }

        return $matchesCreated;
    }

    public function getFixture($disciplineId, $categoryId)
    {
        return GameMatch::with(['localTeam', 'visitorTeam', 'venue'])
            ->where('discipline_id', $disciplineId)
            ->where('category_id', $categoryId)
            ->orderBy('round')
            ->orderBy('match_date')
            ->get();
    }
}