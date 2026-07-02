<?php

namespace App\Services;

use App\Models\Team;
use App\Models\GameMatch;
use App\Models\Group;
use App\Models\GroupTeam;
use App\Models\Category;
use Carbon\Carbon;

class GroupStageService
{
    public function generateGroups($championshipId, $categoryId, $settings, $startDate, $venueIds)
    {
        Group::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->delete();

        GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('phase', 'grupos')
            ->delete();

        $teams = Team::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('registration_status', 'aprobado')
            ->get();

        if ($teams->count() < 2) {
            throw new \Exception('Se necesitan al menos 2 equipos');
        }

        // Obtener discipline_id de la categoria
        $category = Category::find($categoryId);
        $disciplineId = $category?->championshipDiscipline?->discipline_id;

        $numGroups = $settings['num_groups'] ?? 4;
        $advancePerGroup = $settings['advance_per_group'] ?? 2;
        $thirdPlace = $settings['third_place'] ?? false;

        $teamsShuffled = $teams->shuffle();
        $groups = [];
        $teamsPerGroup = ceil($teams->count() / $numGroups);

        for ($i = 0; $i < $numGroups; $i++) {
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
                    'team_id' => $team->id,
                ]);
            }

            $groups[] = $group;
            $this->generateGroupMatches($group, $categoryId, $championshipId, $startDate, $venueIds, $disciplineId);
        }

        return [
            'groups' => $groups,
            'advance_per_group' => $advancePerGroup,
            'third_place' => $thirdPlace,
        ];
    }

    private function generateGroupMatches($group, $categoryId, $championshipId, $startDate, $venueIds, $disciplineId)
    {
        $teamIds = $group->teams->pluck('id')->toArray();

        if (count($teamIds) < 2) {
            return;
        }

        $matches = [];
        $n = count($teamIds);
        $date = Carbon::parse($startDate);
        $venueCount = count($venueIds);

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
                'venue_id' => $venueIds[$venueIndex % $venueCount],
                'round' => $round,
                'phase' => 'grupos',
                'match_date' => $date->copy()->addDays($round * 7)->toDateString(),
                'status' => 'programado',
            ]);
            $round++;
            $venueIndex++;
        }
    }

    public function getGroupStandings($groupId)
    {
        return GroupTeam::with(['team'])
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
                $qualified[] = $standing->team;
            }
        }

        return collect($qualified);
    }
}