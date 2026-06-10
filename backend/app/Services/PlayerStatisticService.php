<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\MatchIncidence;
use App\Models\Player;
use App\Models\PlayerStatistic;

class PlayerStatisticService
{
    public function updateFromMatch(GameMatch $match, $tournamentId = null)
    {
        $incidences = MatchIncidence::where('match_id', $match->id)->get();

        $localPlayers = Player::where('team_id', $match->local_team_id)->get();
        $visitorPlayers = Player::where('team_id', $match->visitor_team_id)->get();

        $allPlayers = $localPlayers->merge($visitorPlayers);

        $results = [];

        foreach ($allPlayers as $player) {
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

            $tournamentStat = PlayerStatistic::firstOrCreate(
                [
                    'player_id' => $player->id,
                    'team_id' => $player->team_id,
                    'discipline_id' => $match->discipline_id,
                    'category_id' => $match->category_id,
                    'tournament_id' => $tournamentId,
                ],
                [
                    'goals' => 0,
                    'yellow_cards' => 0,
                    'red_cards' => 0,
                    'matches_played' => 0,
                ]
            );

            $tournamentStat->matches_played += 1;
            $tournamentStat->goals += $goalsCount;
            $tournamentStat->yellow_cards += $yellowCardsCount;
            $tournamentStat->red_cards += $redCardsCount;

            $tournamentStat->save();

            $results[$player->id] = [
                'player' => $player,
                'tournament_stat' => $tournamentStat,
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

        $tournamentStats = PlayerStatistic::with(['discipline', 'category'])
            ->where('player_id', $playerId)
            ->orderBy('tournament_id')
            ->get();

        return [
            'player' => [
                'id' => $player->id,
                'full_name' => $player->full_name,
                'total_goals' => $player->total_goals,
                'total_yellow_cards' => $player->total_yellow_cards,
                'total_red_cards' => $player->total_red_cards,
                'total_matches_played' => $player->total_matches_played,
            ],
            'tournament_history' => $tournamentStats->map(function ($stat) {
                return [
                    'discipline' => $stat->discipline->name ?? 'N/A',
                    'category' => $stat->category->name ?? 'N/A',
                    'tournament_id' => $stat->tournament_id,
                    'goals' => $stat->goals,
                    'yellow_cards' => $stat->yellow_cards,
                    'red_cards' => $stat->red_cards,
                    'matches_played' => $stat->matches_played,
                ];
            }),
        ];
    }

    public function getTopScorers($disciplineId = null, $categoryId = null, $tournamentId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($disciplineId) {
            $query->where('discipline_id', $disciplineId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($tournamentId) {
            $query->where('tournament_id', $tournamentId);
        }

        $topScorers = $query->orderBy('goals', 'desc')
            ->limit($limit)
            ->get();

        return $topScorers->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => $stat->player->full_name ?? 'N/A',
                'goals' => $stat->goals,
                'matches' => $stat->matches_played,
                'discipline' => $stat->discipline->name ?? 'N/A',
                'category' => $stat->category->name ?? 'N/A',
            ];
        });
    }

    public function getTopYellowCards($disciplineId = null, $categoryId = null, $tournamentId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($disciplineId) {
            $query->where('discipline_id', $disciplineId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($tournamentId) {
            $query->where('tournament_id', $tournamentId);
        }

        $topYellow = $query->orderBy('yellow_cards', 'desc')
            ->limit($limit)
            ->get();

        return $topYellow->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => $stat->player->full_name ?? 'N/A',
                'yellow_cards' => $stat->yellow_cards,
                'matches' => $stat->matches_played,
            ];
        });
    }

    public function getTopRedCards($disciplineId = null, $categoryId = null, $tournamentId = null, $limit = 10)
    {
        $query = PlayerStatistic::with('player');

        if ($disciplineId) {
            $query->where('discipline_id', $disciplineId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($tournamentId) {
            $query->where('tournament_id', $tournamentId);
        }

        $topRed = $query->orderBy('red_cards', 'desc')
            ->limit($limit)
            ->get();

        return $topRed->map(function ($stat) {
            return [
                'player_id' => $stat->player_id,
                'player_name' => $stat->player->full_name ?? 'N/A',
                'red_cards' => $stat->red_cards,
                'matches' => $stat->matches_played,
            ];
        });
    }
}