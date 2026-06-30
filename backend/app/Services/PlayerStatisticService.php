<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\MatchIncidence;
use App\Models\Player;
use App\Models\PlayerStatistic;
use App\Models\TeamPlayer;
use App\Models\DisciplineStatistic;

class PlayerStatisticService
{
    public function updateFromMatch(GameMatch $match, $championshipId = null)
    {
        $incidences = MatchIncidence::where('match_id', $match->id)->get();
        $disciplineStatistics = DisciplineStatistic::where(
            'discipline_id',
            $match->discipline_id
        )
        ->get()
        ->keyBy('slug');


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
            $assistsCount = 0;
            $yellowCardsCount = 0;
            $redCardsCount = 0;

            foreach ($playerIncidences as $incidence) {
                switch ($incidence->incidence_type) {
                    case 'goal':
                        $goalsCount++;
                        break;
                    case 'assist':
                        $assistsCount++;
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

            /*
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
            */

            $this->addStatistic($player, $teamPlayer, $match, $championshipId, $disciplineStatistics->get('matches_played'), 1);
            $this->addStatistic($player, $teamPlayer, $match, $championshipId, $disciplineStatistics->get('goals'), $goalsCount);
            $this->addStatistic($player, $teamPlayer, $match, $championshipId, $disciplineStatistics->get('assists'), $assistsCount);
            $this->addStatistic($player, $teamPlayer, $match, $championshipId, $disciplineStatistics->get('yellow_cards'), $yellowCardsCount);
            $this->addStatistic($player, $teamPlayer, $match, $championshipId, $disciplineStatistics->get('red_cards'), $redCardsCount);

            $statistics = PlayerStatistic::with('statistic')
                ->where('player_id', $player->id)
                ->where('championship_id', $championshipId)
                ->get();
            
            /*
            $results[$player->id] = [
                'player' => $player,
                'championship_stat' => $championshipStat,
                'goals_in_match' => $goalsCount,
                'yellow_cards_in_match' => $yellowCardsCount,
                'red_cards_in_match' => $redCardsCount,
            ];
            */

            $results[$player->id] = [
                'player' => $player,
                'statistics' => $statistics,
            ];
        }

        return $results;
    }

    /*
    public function getPlayerHistory($playerId, bool $publicOnly = false)
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
    */

    public function getPlayerHistory($playerId, bool $publicOnly = false)
    {
        $player = Player::find($playerId);

        if (!$player) {
            return null;
        }

        $statistics = PlayerStatistic::with([
            'discipline',
            'category',
            'championship',
            'disciplineStatistic.statisticType',
        ])
        ->where('player_id', $playerId)
        ->when($publicOnly, function ($query) {
            $query->whereHas('championship', fn ($championship) => $championship->where('is_public', true));
        })
        ->get();

        if ($publicOnly && $statistics->isEmpty()) {
            return null;
        }

        $history = $statistics
            ->groupBy(function ($item) {
                return implode('-', [
                    $item->championship_id,
                    $item->category_id,
                    $item->discipline_id,
                ]);
            })
            ->map(function ($group) {

                $first = $group->first();

                return [
                    'championship' => $first->championship->name ?? null,
                    'discipline' => $first->discipline->name ?? null,
                    'category' => $first->category->name ?? null,

                    'statistics' => $group->map(function ($stat) {
                        return [
                            'id' => $stat->disciplineStatistic->statisticType->id,
                            'slug'=> $stat->disciplineStatistic->statisticType->slug,
                            'display_name' => $stat->disciplineStatistic->statisticType->display_name,
                            'value' => $stat->value,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return [
            'player' => [
                'id' => $player->id,
                'full_name' => trim($player->names . ' ' . $player->last_names),

                // Se mantienen mientras existan esas columnas en Player
                'total_goals' => $player->total_goals,
                'total_yellow_cards' => $player->total_yellow_cards,
                'total_red_cards' => $player->total_red_cards,
                'total_matches_played' => $player->total_matches_played,
            ],

            'championship_history' => $history,
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

    private function addStatistic(
        Player $player,
        TeamPlayer $teamPlayer,
        GameMatch $match,
        ?int $championshipId,
        ?DisciplineStatistic $disciplineStatistic,
        int $amount = 1
    ): void {
        if (!$disciplineStatistic || $amount <= 0) {
            return;
        }

        $statistic = PlayerStatistic::firstOrCreate(
            [
                'player_id' => $player->id,
                'team_id' => $teamPlayer->team_id,
                'discipline_id' => $match->discipline_id,
                'category_id' => $match->category_id,
                'championship_id' => $championshipId,
                'discipline_statistic_id' => $disciplineStatistic->id,
            ],
            [
                'value' => 0,
            ]
        );

        $statistic->increment('value', $amount);
    }

    public function getRanking(
        int $disciplineId,
        int $statisticTypeId,
        ?int $championshipId = null,
        ?int $categoryId = null,
        int $limit = 10,
        bool $publicOnly = false
    ) {
        $disciplineStatistic = DisciplineStatistic::where('discipline_id', $disciplineId)
            ->where('statistic_type_id', $statisticTypeId)
            ->first();

        if (!$disciplineStatistic) {
            return collect();
        }

        $query = PlayerStatistic::with([
            'player',
            'team',
            'disciplineStatistic.statisticType',
        ])
        ->where('discipline_statistic_id', $disciplineStatistic->id)
        ->when($publicOnly, function ($query) {
            $query->whereHas('championship', fn ($championship) => $championship->where('is_public', true));
        });

        if ($championshipId) {
            $query->where('championship_id', $championshipId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return $query
            ->orderByDesc('value')
            ->limit($limit)
            ->get()
            ->map(function ($stat) {
                return [
                    'player_id' => $stat->player->id,
                    'player_name' => trim(
                        $stat->player->names . ' ' . $stat->player->last_names
                    ),
                    'team' => $stat->team?->name,
                    'value' => $stat->value,
                    'statistic' => [
                        'id' => $stat->disciplineStatistic->statisticType->id,
                        'slug' => $stat->disciplineStatistic->statisticType->slug,
                        'display_name' => $stat->disciplineStatistic->statisticType->display_name,
                    ],
                ];
            });
    }

    public function getRankingBySlug(
        string $slug,
        ?int $disciplineId = null,
        ?int $championshipId = null,
        ?int $categoryId = null,
        int $limit = 10,
        bool $publicOnly = false
    ) {
        $query = PlayerStatistic::with([
                'player',
                'team',
                'disciplineStatistic.statisticType',
            ])
            ->whereHas('disciplineStatistic.statisticType', fn ($type) => $type->where('slug', $slug))
            ->when($publicOnly, function ($statistics) {
                $statistics->whereHas('championship', fn ($championship) => $championship->where('is_public', true));
            });

        if ($disciplineId) {
            $query->where('discipline_id', $disciplineId);
        }
        if ($championshipId) {
            $query->where('championship_id', $championshipId);
        }
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return $query->orderByDesc('value')
            ->limit($limit)
            ->get()
            ->map(function ($stat) {
                return [
                    'player_id' => $stat->player?->id,
                    'player_name' => trim(($stat->player?->names ?? '') . ' ' . ($stat->player?->last_names ?? '')),
                    'team' => $stat->team?->name,
                    'value' => $stat->value,
                    'statistic' => [
                        'id' => $stat->disciplineStatistic?->statisticType?->id,
                        'slug' => $stat->disciplineStatistic?->statisticType?->slug,
                        'display_name' => $stat->disciplineStatistic?->statisticType?->display_name,
                    ],
                ];
            });
    }

    public function skipWalkoverStatistics(GameMatch $match)
    {
        return true;
    }

}