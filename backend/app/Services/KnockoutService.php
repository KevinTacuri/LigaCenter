<?php

namespace App\Services;

use App\Models\Team;
use App\Models\GameMatch;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class KnockoutService
{
    public function generateKnockout($championshipId, $categoryId, $qualifiedTeams, $startDate, $venueIds, $thirdPlace = false)
    {
        if ($qualifiedTeams->count() < 2) {
            throw new \Exception('Se necesitan al menos 2 equipos');
        }

        $numTeams = $qualifiedTeams->count();
        $numPhases = log($numTeams, 2);

        if (!is_int($numPhases)) {
            throw new \Exception('El número de equipos debe ser potencia de 2 para eliminatoria directa');
        }

        $phaseNames = $this->getPhaseNames($numPhases);
        $matches = [];
        $currentTeams = $qualifiedTeams->shuffle();

        $date = Carbon::parse($startDate);
        $venueCount = count($venueIds);
        $round = 1;

        foreach ($phaseNames as $phaseIndex => $phaseName) {
            $phaseMatches = $this->generatePhaseMatches(
                $currentTeams,
                $phaseName,
                $championshipId,
                $categoryId,
                $date,
                $venueIds,
                $round,
                $phaseIndex
            );

            $matches = array_merge($matches, $phaseMatches);

            $currentTeams = $this->getWinnersFromMatches($phaseMatches);
            $date->addDays(7);
            $round++;
        }

        if ($thirdPlace) {
            $this->generateThirdPlaceMatch($championshipId, $categoryId, $matches, $date, $venueIds);
        }

        return $matches;
    }

    private function getPhaseNames($numPhases)
    {
        $phases = [
            1 => ['final'],
            2 => ['semifinal', 'final'],
            3 => ['cuartos', 'semifinal', 'final'],
            4 => ['octavos', 'cuartos', 'semifinal', 'final'],
            5 => ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'],
            6 => ['treintaidosavos', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'],
        ];

        return $phases[$numPhases] ?? ['final'];
    }

    private function generatePhaseMatches($teams, $phaseName, $championshipId, $categoryId, $date, $venueIds, $round, $phaseIndex)
    {
        $matches = [];
        $teamIds = $teams->pluck('id')->toArray();
        $venueCount = count($venueIds);

        for ($i = 0; $i < count($teamIds); $i += 2) {
            if (isset($teamIds[$i + 1])) {
                $match = GameMatch::create([
                    'championship_id' => $championshipId,
                    'category_id' => $categoryId,
                    'home_team_id' => $teamIds[$i],
                    'away_team_id' => $teamIds[$i + 1],
                    'venue_id' => $venueIds[$i % $venueCount],
                    'round' => $round,
                    'phase' => $phaseName,
                    'match_date' => $date->copy()->addDays($phaseIndex * 7)->toDateString(),
                    'status' => 'programado',
                ]);
                $matches[] = $match;
            }
        }

        return $matches;
    }

    private function getWinnersFromMatches($matches)
    {
        $winners = new Collection();

        foreach ($matches as $match) {
            if ($match->home_score !== null && $match->away_score !== null) {
                if ($match->home_score > $match->away_score) {
                    $winners->push($match->homeTeam);
                } elseif ($match->home_score < $match->away_score) {
                    $winners->push($match->awayTeam);
                } else {
                    $winners->push($match->homeTeam);
                }
            } else {
                $winners->push($match->homeTeam);
            }
        }

        return $winners;
    }

    private function generateThirdPlaceMatch($championshipId, $categoryId, $matches, $date, $venueIds)
    {
        $semifinalLosers = [];

        foreach ($matches as $match) {
            if ($match->phase === 'semifinal') {
                if ($match->home_score !== null && $match->away_score !== null) {
                    if ($match->home_score < $match->away_score) {
                        $semifinalLosers[] = $match->homeTeam;
                    } else {
                        $semifinalLosers[] = $match->awayTeam;
                    }
                }
            }
        }

        if (count($semifinalLosers) >= 2) {
            GameMatch::create([
                'championship_id' => $championshipId,
                'category_id' => $categoryId,
                'home_team_id' => $semifinalLosers[0]->id,
                'away_team_id' => $semifinalLosers[1]->id,
                'venue_id' => $venueIds[0],
                'phase' => 'tercer_puesto',
                'match_date' => $date->copy()->addDays(7)->toDateString(),
                'status' => 'programado',
            ]);
        }
    }
}