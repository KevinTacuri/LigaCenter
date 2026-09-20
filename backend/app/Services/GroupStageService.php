<?php

namespace App\Services;

use App\Models\ChampionshipTeam;
use App\Models\GameMatch;
use App\Models\Group;
use App\Models\GroupTeam;
use App\Models\Category;
use Carbon\Carbon;

class GroupStageService
{
    public function generateGroups($championshipId, $categoryId, $settings, $startDate, $venueIds)
    {
        // 1. Limpiar grupos y partidos previos
        Group::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->delete();

        GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('phase', 'grupos')
            ->delete();

        // 2. Obtener los equipos inscritos
        $teams = ChampionshipTeam::whereHas('championshipDiscipline', function ($query) use ($championshipId) {
                $query->where('championship_id', $championshipId);
            })
            ->where('category_id', $categoryId)
            ->where('registration_status', 'aprobado')
            ->get();

        if ($teams->count() < 2) {
            throw new \Exception('Se necesitan al menos 2 equipos aprobados en la categoría.');
        }

        // 3. Obtener discipline_id desde la categoría
        $category = Category::find($categoryId);
        $disciplineId = $category?->championshipDiscipline?->discipline_id;

        $numGroups = $settings['num_groups'] ?? 4;
        $advancePerGroup = $settings['advance_per_group'] ?? 2;
        $thirdPlace = $settings['third_place'] ?? false;

        $teamsShuffled = $teams->shuffle();
        $groups = [];
        $teamsPerGroup = (int) ceil($teams->count() / $numGroups);

        for ($i = 0; $i < $numGroups; $i++) {
            if ($teamsShuffled->isEmpty()) {
                break;
            }

            $groupName = chr(65 + $i);
            $group = Group::create([
                'championship_id' => $championshipId,
                'category_id' => $categoryId,
                'name' => 'Grupo ' . $groupName,
                'position' => $i + 1,
            ]);

            $groupTeams = $teamsShuffled->splice(0, $teamsPerGroup);

            foreach ($groupTeams as $team) {
                GroupTeam::create([
                    'group_id' => $group->id,
                    'championship_team_id' => $team->id,
                ]);
            }

            $groups[] = $group;

            // Generar partidos del grupo
            $this->generateGroupMatches($group, $groupTeams, $categoryId, $championshipId, $startDate, $venueIds, $disciplineId);
        }

        return [
            'groups' => $groups,
            'advance_per_group' => $advancePerGroup,
            'third_place' => $thirdPlace,
        ];
    }

    private function generateGroupMatches($group, $groupTeams, $categoryId, $championshipId, $startDate, $venueIds, $disciplineId)
    {
        $teamIds = $groupTeams->pluck('id')->toArray();

        if (count($teamIds) < 2) {
            return;
        }

        $matches = [];
        $n = count($teamIds);
        $date = Carbon::parse($startDate);
        $venueCount = is_array($venueIds) && count($venueIds) > 0 ? count($venueIds) : 0;

        for ($i = 0; $i < $n; $i++) {
            for ($j = $i + 1; $j < $n; $j++) {
                $matches[] = [
                    'home' => $teamIds[$i],
                    'away' => $teamIds[$j],
                ];
            }
        }

        $venueIndex = 0;
        $round = 1;

        foreach ($matches as $match) {
            GameMatch::create([
                'championship_id' => $championshipId,
                'category_id' => $categoryId,
                'group_id' => $group->id,
                'discipline_id' => $disciplineId,
                'home_team_id' => $match['home'],
                'away_team_id' => $match['away'],
                'venue_id' => $venueCount > 0 ? $venueIds[$venueIndex % $venueCount] : null,
                'round' => $round,
                'phase' => 'grupos',
                'match_date' => $date->copy()->addDays(($round - 1) * 7)->toDateString(),
                'status' => 'programado',
            ]);
            $round++;
            $venueIndex++;
        }
    }

    public function getGroupStandings($groupId)
    {
        // Usa team.team para cargar de GroupTeam -> ChampionshipTeam -> Team
        return GroupTeam::with(['team.team'])
            ->where('group_id', $groupId)
            ->orderBy('points', 'desc')
            ->orderBy('goals_for', 'desc')
            ->get();
    }

    public function getQualifiedTeams($championshipId, $categoryId, $advancePerGroup)
    {
        $groups = Group::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->get();

        $qualified = [];

        foreach ($groups as $group) {
            $standings = $this->getGroupStandings($group->id);
            foreach ($standings->take($advancePerGroup) as $standing) {
                // $standing->team obtiene la instancia de ChampionshipTeam
                $qualified[] = $standing->team;
            }
        }

        return collect($qualified);
    }
}