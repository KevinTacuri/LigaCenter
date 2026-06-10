<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\MatchIncidence;
use App\Models\Player;
use App\Models\PlayerStatistic;
use App\Models\TeamPlayer;

class PlayerStatisticService
{
    public function updateFromMatch(GameMatch $match, $championshipId = null)
    {
        $incidences = MatchIncidence::where('match_id', $match->id)->get();

        $localTeamPlayers = TeamPlayer::where('team_id', $match->local_team_id)
            ->with('player')
            ->get();

        $visitorTeamPlayers = TeamPlayer::where('team_id', $match->visitor_team_id)
            ->with('player')
            ->get();

        $allTeamPlayers = $localTeamPlayers->merge($visitorTeamPlayers);
        $results = [];

        foreach ($allTeamPlayers as $teamPlayer) {
            $player = $teamPlayer->player;

            if (!$player) {
                continue;
            }

            $player->total_matches_played += 1;

            $playerIncidences = $incidences->where('player_id', $player->id);

            $goalsCount = 0;
            $yellowCardsCount = 0;
            $redCardsCount = 0;

            foreach ($playerIncidences as $incidence) {
                switch ($incidence->incidence_type) {
                    case 'goal':
                        $goalsCount++;
                        break;
                    case 'yellow_card':
                        $yellowCardsCount++;
                        break;
                    case 'red_card':
                        $redCardsCount++;
                        break;
                }
            }

            $player->total_goals += $goalsCount;
            $player->total_yellow_cards += $yellowCardsCount;
            $player->total_red_cards += $redCardsCount;
            $player->save();

            $championshipStat = PlayerStatistic::firstOrCreate(
                [
                    'player_id' => $player->id,
                    'team_id' => $teamPlayer->team_id,
                    'discipline_id' => $match->discipline_id,
                    'category_id' => $match->category_id,
                    'championship_id' => $championshipId,
                ],
                [
                    'goals' => 0,
                    'yellow_cards' => 0,
                    'red_cards' => 0,
                    'matches_played' => 0,
                ]
            );

            $championshipStat->matches_played += 1;
            $championshipStat->goals += $goalsCount;
            $championshipStat->yellow_cards += $yellowCardsCount;
            $championshipStat->red_cards += $redCardsCount;
            $championshipStat->save();

            $results[$player->id] = [
                'player' => $player,
                'championship_stat' => $championshipStat,
                'goals_in_match' => $goalsCount,
                'yellow_cards_in_match' => $yellowCardsCount,
                'red_cards_in_match' => $redCardsCount,
            ];
        }

        return $results;
    }

    public function getPlayerHistory($playerId)
    {
        $player = Player::find($playerId);

        if (!$player) {
            return null;
        }

        $championshipStats = PlayerStatistic::with(['discipline', 'category', 'championship'])
            ->where('player_id', $playerId)
            ->orderBy('championship_id')
            ->get();

        return [
            'player' => [
                'id' => $player->id,
                'full_name' => $player->names . ' ' . $player->last_names,
                'total_goals' => $player->total_goals,
                'total_yellow_cards' => $player->total_yellow_cards,
                'total_red_cards' => $player->total_red_cards,
                'total_matches_played' => $player->total_matches_played,
            ],
            'championship_history' => $championshipStats->map(function ($stat) {
                return [
                    'championship' => $stat->championship->name ?? 'N/A',
                    'discipline' => $stat->discipline->name ?? 'N/A',
                    'category' => $stat->category->name ?? 'N/A',
                    'goals' => $stat->goals,
                    'yellow_cards' => $stat->yellow_cards,
                    'red_cards' => $stat->red_cards,
                    'matches_played' => $stat->matches_played,
                ];
            }),
        ];
    }

    public function getTopScorers($championshipId = null, $categoryId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($championshipId) {
            $query->where('championship_id', $championshipId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $topScorers = $query->orderBy('goals', 'desc')
            ->limit($limit)
            ->get();

        return $topScorers->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => ($stat->player->names ?? '') . ' ' . ($stat->player->last_names ?? ''),
                'goals' => $stat->goals,
                'matches' => $stat->matches_played,
                'category' => $stat->category->name ?? 'N/A',
            ];
        });
    }

    public function getTopYellowCards($championshipId = null, $categoryId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($championshipId) {
            $query->where('championship_id', $championshipId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $topYellow = $query->orderBy('yellow_cards', 'desc')
            ->limit($limit)
            ->get();

        return $topYellow->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => ($stat->player->names ?? '') . ' ' . ($stat->player->last_names ?? ''),
                'yellow_cards' => $stat->yellow_cards,
                'matches' => $stat->matches_played,
            ];
        });
    }

    public function getTopRedCards($championshipId = null, $categoryId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($championshipId) {
            $query->where('championship_id', $championshipId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $topRed = $query->orderBy('red_cards', 'desc')
            ->limit($limit)
            ->get();

        return $topRed->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => ($stat->player->names ?? '') . ' ' . ($stat->player->last_names ?? ''),
                'red_cards' => $stat->red_cards,
                'matches' => $stat->matches_played,
            ];
        });
    }
}