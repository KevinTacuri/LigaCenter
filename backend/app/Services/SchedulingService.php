<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Standing;
use App\Models\Venue;

class SchedulingService
{
    public function scheduleMatchesForRound($championshipId, $categoryId, $round, $availableHours, $venueIds)
    {
        $matches = GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('round', $round)
            ->get();

        if ($matches->isEmpty()) {
            throw new \Exception('No hay partidos para esta fecha');
        }

        $matchesWithRelevance = [];
        foreach ($matches as $match) {
            $localPoints = $this->getTeamPoints($match->home_team_id, $championshipId, $categoryId);
            $visitorPoints = $this->getTeamPoints($match->away_team_id, $championshipId, $categoryId);
            $relevance = $localPoints + $visitorPoints;

            $matchesWithRelevance[] = [
                'match' => $match,
                'relevance' => $relevance,
            ];
        }

        usort($matchesWithRelevance, function ($a, $b) {
            return $a['relevance'] <=> $b['relevance'];
        });

        $venueCount = count($venueIds);
        $scheduledMatches = [];

        foreach ($matchesWithRelevance as $index => $item) {
            $match = $item['match'];
            $hour = $availableHours[$index] ?? end($availableHours);
            $venueId = $venueIds[$index % $venueCount];
            $venue = Venue::find($venueId);

            $match->update([
                'match_time' => $hour,
                'venue_id' => $venueId,
                'status' => 'programado',
            ]);

            $scheduledMatches[] = [
                'match_id' => $match->id,
                'local' => $match->homeTeam->name ?? 'N/A',
                'visitor' => $match->awayTeam->name ?? 'N/A',
                'time' => $hour,
                'venue' => $venue->name ?? 'N/A',
                'relevance' => $item['relevance'],
            ];
        }

        return $scheduledMatches;
    }

    private function getTeamPoints($teamId, $championshipId, $categoryId)
    {
        $standing = Standing::where('team_id', $teamId)
            ->where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->first();

        return $standing ? $standing->total_points : 0;
    }
}