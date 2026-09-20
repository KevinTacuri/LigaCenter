<?php

namespace App\Services;

use App\Models\ChampionshipTeam;
use App\Models\GameMatch;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class KnockoutService
{
    public function generateKnockout($championshipId, $categoryId, $qualifiedTeams, $startDate, $venueIds, $thirdPlace = false)
    {
        if ($qualifiedTeams->count() < 2) {
            throw new \Exception('Se necesitan al menos 2 equipos');
        }

        GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->whereNotIn('phase', ['grupos', 'liga', 'fase_regular'])
            ->delete();
        
        // Obtener discipline_id de la categoria
        $category = Category::find($categoryId);
        $disciplineId = $category?->championshipDiscipline?->discipline_id;

        $numTeams = $qualifiedTeams->count();

        if (($numTeams & ($numTeams - 1)) !== 0) {
            throw new \Exception('El número de equipos debe ser potencia de 2 para eliminatoria directa');
        }

        $numPhases = (int) log($numTeams, 2);

        $phaseNames = $this->getPhaseNames($numPhases);
        
        $currentTeams = $qualifiedTeams->shuffle()->values();
        $previousRoundMatches = [];
        $allCreatedMatches = [];

        $date = Carbon::parse($startDate);
        $venueCount = count($venueIds);

        foreach ($phaseNames as $phaseIndex => $phaseName) {
            $currentRoundMatches = [];
            
            // Calcular cuántos partidos matemáticos corresponden a esta fase actual
            $matchesInPhase = (int) ($numTeams / pow(2, $phaseIndex + 1));
            if ($matchesInPhase < 1) $matchesInPhase = 1;

            for ($i = 0; $i < $matchesInPhase; $i++) {
                $matchData = [
                    'championship_id' => $championshipId,
                    'category_id'     => $categoryId,
                    'discipline_id'   => $disciplineId,
                    'venue_id'        => $venueIds[$i % $venueCount] ?? $venueIds[0],
                    'round'           => $phaseIndex + 1,
                    'phase'           => $phaseName,
                    'match_date'      => $date->copy()->addDays($phaseIndex * 7)->toDateString(),
                    'status'          => 'programado',
                ];

                if ($phaseIndex === 0) {
                    // PRIMERA RONDA: Registramos los equipos reales mezclados que vienen de la petición
                    $homeTeam = $currentTeams->shift();
                    $awayTeam = $currentTeams->shift();

                    $matchData['home_team_id'] = $homeTeam['id'] ?? null;
                    $matchData['away_team_id'] = $awayTeam['id'] ?? null;
                } else {
                    // RONDAS AVANZADAS: Van vacías (null) pero enlazadas a los partidos padres de la ronda anterior
                    $parentHome = $previousRoundMatches[$i * 2] ?? null;
                    $parentAway = $previousRoundMatches[($i * 2) + 1] ?? null;

                    $matchData['home_team_id'] = null;
                    $matchData['away_team_id'] = null;
                    
                    $matchData['parent_home_match_id'] = $parentHome ? $parentHome->id : null;
                    $matchData['parent_away_match_id'] = $parentAway ? $parentAway->id : null;

                    // Textos informativos para pintar en el frontend estilo Sofascore
                    $matchData['placeholder_text_home'] = "Ganador Llave " . ($parentHome ? ($i * 2 + 1) : '?');
                    $matchData['placeholder_text_away'] = "Ganador Llave " . ($parentAway ? ($i * 2 + 2) : '?');
                }

                $match = GameMatch::create($matchData);
                $currentRoundMatches[] = $match;
                $allCreatedMatches[] = $match;
            }

            // Los partidos creados en esta ronda se convierten en los "padres" de la siguiente
            $previousRoundMatches = $currentRoundMatches;
        }

        // Generar definición de tercer puesto si se requiere, basándonos en las dos llaves de Semifinal
        if ($thirdPlace && $numPhases >= 2) {
            // Buscamos las semifinales dentro de los partidos creados
            $semifinales = array_values(array_filter($allCreatedMatches, function ($m) {
                return $m->phase === 'semifinal';
            }));
            $semifinales = array_values($semifinales); // Reindexar

            if (count($semifinales) === 2) {
                $thirdPlaceMatch = GameMatch::create([
                    'championship_id'       => $championshipId,
                    'category_id'           => $categoryId,
                    'discipline_id'         => $disciplineId,
                    'venue_id'              => $venueIds[0],
                    'round'                 => $numPhases,
                    'phase'                 => 'tercer_puesto',
                    'parent_home_match_id'  => $semifinales[0]->id,
                    'parent_away_match_id'  => $semifinales[1]->id,
                    'placeholder_text_home' => "Perdedor Semifinal 1",
                    'placeholder_text_away' => "Perdedor Semifinal 2",
                    'match_date'            => $date->copy()->addDays(($numPhases - 1) * 7)->toDateString(),
                    'status'                => 'programado',
                ]);

                $allCreatedMatches[] = $thirdPlaceMatch;
            }
        }

        return $allCreatedMatches;
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

    private function generatePhaseMatches($teams, $phaseName, $championshipId, $categoryId, $date, $venueIds, $round, $phaseIndex, $disciplineId)
    {
        $matches = [];
        $teamIds = $teams->pluck('id')->toArray();
        $venueCount = count($venueIds);

        for ($i = 0; $i < count($teamIds); $i += 2) {
            if (isset($teamIds[$i + 1])) {
                $match = GameMatch::create([
                    'championship_id' => $championshipId,
                    'category_id' => $categoryId,
                    'discipline_id' => $disciplineId,
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

    private function generateThirdPlaceMatch($championshipId, $categoryId, $matches, $date, $venueIds, $disciplineId)
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
                'discipline_id' => $disciplineId,
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