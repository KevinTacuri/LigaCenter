<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Standing;

class StandingService
{
    public function updateFromMatch(GameMatch $match, int $localScore, int $visitorScore)
    {
        $localStanding = Standing::firstOrCreate(
            [
                'team_id' => $match->local_team_id,
                'championship_id' => $match->championship_id,
                'category_id' => $match->category_id,
            ],
            [
                'matches_played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_for' => 0,
                'goals_against' => 0,
                'goal_difference' => 0,
                'points' => 0,
            ]
        );

        $visitorStanding = Standing::firstOrCreate(
            [
                'team_id' => $match->visitor_team_id,
                'championship_id' => $match->championship_id,
                'category_id' => $match->category_id,
            ],
            [
                'matches_played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_for' => 0,
                'goals_against' => 0,
                'goal_difference' => 0,
                'points' => 0,
            ]
        );

        $localStanding->matches_played++;
        $visitorStanding->matches_played++;

        $localStanding->goals_for += $localScore;
        $localStanding->goals_against += $visitorScore;

        $visitorStanding->goals_for += $visitorScore;
        $visitorStanding->goals_against += $localScore;

        if ($localScore > $visitorScore) {
            $localStanding->wins++;
            $localStanding->points += 3;
            $visitorStanding->losses++;
        } elseif ($localScore < $visitorScore) {
            $visitorStanding->wins++;
            $visitorStanding->points += 3;
            $localStanding->losses++;
        } else {
            $localStanding->draws++;
            $visitorStanding->draws++;
            $localStanding->points += 1;
            $visitorStanding->points += 1;
        }

        $localStanding->goal_difference = $localStanding->goals_for - $localStanding->goals_against;
        $visitorStanding->goal_difference = $visitorStanding->goals_for - $visitorStanding->goals_against;

        $localStanding->last_updated = now();
        $visitorStanding->last_updated = now();

        $localStanding->save();
        $visitorStanding->save();

        return [
            'local' => $localStanding,
            'visitor' => $visitorStanding,
        ];
    }
}