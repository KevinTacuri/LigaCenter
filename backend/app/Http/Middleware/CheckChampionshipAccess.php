<?php

namespace AppHttpMiddleware;

use AppModelsCategory;
use AppModelsChampionship;
use AppModelsChampionshipDiscipline;
use AppModelsChampionshipUser;
use AppModelsGameMatch;
use AppModelsGroup;
use AppModelsGroupTeam;
use AppModelsMatchIncidence;
use AppModelsMatchReport;
use AppModelsPlayer;
use AppModelsSanction;
use AppModelsStanding;
use AppModelsTeam;
use AppModelsTeamPlayer;
use AppModelsVenue;
use Closure;
use IlluminateDatabaseEloquentModel;
use IlluminateHttpRequest;

class CheckChampionshipAccess
{
    public function handle(Request $request, Closure $next)
    {
        $championshipId = $this->value($request->route('championship_id'))
            ?? $this->value($request->route('championshipId'))
            ?? $this->value($request->route('championship'))
            ?? $request->input('championship_id')
            ?? $request->query('championship_id')
            ?? $request->header('X-Championship-ID')
            ?? $this->resolveResourceChampionshipId($request);

        if (!$championshipId) {
            $uri = $request->route()?->uri() ?? '';
            $isChampionshipCollection = $uri === 'championships';

            if (!$request->isMethod('GET') && !$isChampionshipCollection && !$request->user()?->hasRole('super-admin')) {
                return response()->json(['message' => 'Debes indicar el campeonato activo'], 422);
            }

            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $championship = Championship::find($championshipId);
        if (!$championship) {
            return response()->json(['message' => 'Campeonato no encontrado'], 404);
        }

        $hasAccess = $championship->user_id === $user->id
            || $championship->users()->where('user_id', $user->id)->exists()
            || $user->hasRole('super-admin');

        if (!$hasAccess) {
            return response()->json(['message' => 'No tienes acceso a este campeonato'], 403);
        }

        if (!$this->resourceBelongsToChampionship($request, (int) $championshipId)) {
            return response()->json(['message' => 'El recurso no pertenece al campeonato activo'], 403);
        }

        return $next($request);
    }

    private function resolveResourceChampionshipId(Request $request): ?int
    {
        $uri = $request->route()?->uri() ?? '';
        $parameters = $request->route()?->parameters() ?? [];
        $resource = null;

        foreach (['id', 'team', 'player', 'category', 'standing', 'championshipDiscipline', 'venue', 'match_report', 'match_incidence', 'sanction', 'group_team', 'team_player', 'championship_user'] as $key) {
            if (array_key_exists($key, $parameters)) {
                $resource = $this->value($parameters[$key]);
                break;
            }
        }

        if (!$resource) {
            return null;
        }
        if (str_starts_with($uri, 'championships/{id}')) {
            return (int) $resource;
        }
        if (str_starts_with($uri, 'teams/')) {
            return Team::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'players/')) {
            return Player::find($resource)?->teams()->value('teams.championship_id');
        }
        if (str_starts_with($uri, 'categories/')) {
            return Category::find($resource)?->championshipDiscipline?->championship_id;
        }
        if (str_starts_with($uri, 'championship-disciplines/')) {
            return ChampionshipDiscipline::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'matches/')) {
            return GameMatch::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'groups/')) {
            return Group::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'group-teams/')) {
            return GroupTeam::find($resource)?->group?->championship_id;
        }
        if (str_starts_with($uri, 'standings/')) {
            return Standing::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'match-reports/')) {
            return MatchReport::find($resource)?->match?->championship_id;
        }
        if (str_starts_with($uri, 'match-incidences/')) {
            return MatchIncidence::find($resource)?->match?->championship_id;
        }
        if (str_starts_with($uri, 'sanctions/')) {
            return Sanction::find($resource)?->match?->championship_id;
        }
        if (str_starts_with($uri, 'team-players/')) {
            return TeamPlayer::find($resource)?->team?->championship_id;
        }
        if (str_starts_with($uri, 'championship-users/')) {
            return ChampionshipUser::find($resource)?->championship_id;
        }
        if (str_starts_with($uri, 'venues/')) {
            return Venue::find($resource)?->championship_id;
        }

        return null;
    }

    private function resourceBelongsToChampionship(Request $request, int $championshipId): bool
    {
        $uri = $request->route()?->uri() ?? '';
        $parameters = $request->route()?->parameters() ?? [];
        $resourceId = null;

        foreach (['id', 'team', 'player', 'category', 'standing', 'championshipDiscipline', 'discipline', 'venue', 'match_report', 'match_incidence', 'sanction', 'group_team', 'team_player', 'championship_user'] as $key) {
            if (array_key_exists($key, $parameters)) {
                $resourceId = $this->value($parameters[$key]);
                break;
            }
        }

        if (!$resourceId) {
            return true;
        }

        if (str_starts_with($uri, 'championships/{id}')) {
            return (int) $resourceId === $championshipId;
        }
        if (str_starts_with($uri, 'teams/')) {
            return Team::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'players/')) {
            return Player::whereKey($resourceId)
                ->whereHas('teams', fn ($q) => $q->where('teams.championship_id', $championshipId))
                ->exists();
        }
        if (str_starts_with($uri, 'categories/')) {
            return Category::whereKey($resourceId)
                ->whereHas('championshipDiscipline', fn ($q) => $q->where('championship_id', $championshipId))
                ->exists();
        }
        if (str_starts_with($uri, 'championship-disciplines/')) {
            return ChampionshipDiscipline::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'disciplines/')) {
            return $request->isMethod('GET') || $request->user()->hasRole('super-admin');
        }
        if (str_starts_with($uri, 'matches/')) {
            return GameMatch::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'groups/')) {
            return Group::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'group-teams/')) {
            return GroupTeam::whereKey($resourceId)
                ->whereHas('group', fn ($q) => $q->where('championship_id', $championshipId))
                ->exists();
        }
        if (str_starts_with($uri, 'standings/')) {
            return Standing::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'match-reports/')) {
            $report = MatchReport::find($resourceId);
            return !$report || GameMatch::whereKey($report->match_id)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'match-incidences/')) {
            $incidence = MatchIncidence::find($resourceId);
            return !$incidence || GameMatch::whereKey($incidence->match_id)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'sanctions/')) {
            $sanction = Sanction::find($resourceId);
            return !$sanction || GameMatch::whereKey($sanction->origin_match_id)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'team-players/')) {
            $teamPlayer = TeamPlayer::find($resourceId);
            return !$teamPlayer || Team::whereKey($teamPlayer->team_id)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'championship-users/')) {
            return ChampionshipUser::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }
        if (str_starts_with($uri, 'venues/')) {
            return Venue::whereKey($resourceId)->where('championship_id', $championshipId)->exists();
        }

        return true;
    }

    private function value(mixed $value): mixed
    {
        return $value instanceof Model ? $value->getKey() : $value;
    }
}
