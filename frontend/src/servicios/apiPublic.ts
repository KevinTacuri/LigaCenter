import axios from 'axios';

const API_URL = __VITE_API_URL__ || 'http://127.0.0.1:8000/api';

const apiPublic = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

apiPublic.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && !(response.data instanceof Blob)) {
            const keys = Object.keys(response.data);
            const isWrapped = keys.includes('success') && keys.includes('data');
            if (!isWrapped) {
                response.data = {
                    success: true,
                    data: response.data,
                    message: null
                };
            }
        } else if (Array.isArray(response.data)) {
            response.data = {
                success: true,
                data: response.data,
                message: null
            };
        }
        return response;
    },
    (error) => {
        console.error('Error en API Pública:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export interface PublicDiscipline {
    id: number;
    name: string;
}

export interface PublicTeam {
    id: number;
    name: string;
    logo: string | null;
}

export interface PublicPlayer {
    id: number;
    name: string;
    photo: string | null;
    jersey_number: number | null;
}

export interface PublicTeamStanding {
    position: number | null;
    points: number;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
}

export interface PublicTeamRecentMatch {
    id: number;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    date: string | null;
}

export interface PublicTeamDetail {
    team: PublicTeam;
    players: PublicPlayer[];
    recent_matches: PublicTeamRecentMatch[];
    standing: PublicTeamStanding | null;
}

export interface PublicChampionship {
    id: number;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    disciplines: PublicDiscipline[];
    teams_count: number;
    matches_count: number;
}

export interface PublicCategory {
    id: number;
    name: string;
    format: string;
    format_settings: any;
    description: string | null;
    gender_type: string | null;
    age_min: number | null;
    age_max: number | null;
    championship_discipline_id: number;
    discipline_id: number;
    discipline_name: string;
}

export interface PublicChampionshipDiscipline {
    id: number;
    name: string;
    championship_discipline_id: number;
}

export interface PublicMatch {
    id: number;
    home_team: PublicTeam;
    away_team: PublicTeam;
    home_score: number | null;
    away_score: number | null;
    status: 'pendiente' | 'en_vivo' | 'finalizado' | 'cancelado' | 'reprogramado';
    match_date: string | null;
    match_time: string | null;
    datetime: string | null;
    elapsed_time: number | null;
    timer_status: 'stopped' | 'running' | 'paused' | 'finished' | null;
    current_period: number | null;
    discipline_id: number;
    category_id: number;
    discipline_name?: string | null; // ← AGREGAR
    category_name?: string | null; // ← AGREGAR
    category?: {
        id: number;
        name: string;
        discipline_id: number;
    };
    venue: {
        id: number;
        name: string;
        location: string | null;
    } | null;
    championship: {
        id: number;
        name: string;
    } | null;
    group: {
        id: number;
        name: string;
    } | null;
    round: number | null;
    phase: string | null;
}

export interface PublicStanding {
    position: number | null;
    team: PublicTeam;
    team_id?: number;
    category_id?: number; 
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
    form: string | null;
    // Campos para vóley
    wins_total?: number;
    losses_total?: number;
    sets_for?: number;
    sets_against?: number;
    sets_ratio?: number;
    points_for?: number;
    points_against?: number;
    points_ratio?: number;
    // Campos para básquet
    win_percentage?: number;
    games_behind?: number;
    streak?: string | null;
}

export interface SearchResults {
    championships?: PublicChampionship[];
    matches?: PublicMatch[];
    teams?: PublicTeam[];
    players?: PublicPlayer[];
}

export interface ChampionshipStats {
    total_matches: number;
    total_goals: number;
    avg_goals_per_match: number;
    teams_count: number;
    top_scorers: Array<{
        id: number;
        name: string;
        goals: number;
    }>;
}

export interface PublicCompetitionEvent {
  id: number;
  name: string;
  event_type: string;
  status: string;

  championship_id: number;
  championship_name?: string;

  discipline_id: number;
  discipline_name?: string;

  category_id: number;
  category_name?: string;

  date?: string | null;
  start_time?: string | null;

  venue?: {
    id: number;
    name: string;
  } | null;

  current_stage?: {
    id: number;
    name: string;
    stage_type: string;
    status: string;
  } | null;

  current_group?: {
    id: number;
    name: string;
    status: string;
  } | null;
}

export interface PublicEventStage {
  id: number;
  name: string;
  stage_type: string;
  stage_number: number;
  status: string;
  groups: PublicEventGroup[];
  qualification_method?: 'best_overall' | 'best_per_group' | 'all' | 'none' | null;
  qualifiers_count?: number | null;
  qualifiers_per_group?: number | null;
  podium_places?: number | null;
}

export interface PublicEventGroup {
  id: number;
  name: string;
  group_number: number;
  status: string;
  date?: string | null;
  start_time?: string | null;
}

export interface PublicCompetitionEventDetail extends PublicCompetitionEvent {
  participation_type: string;
  competition_format?: string | null;
  result_aggregation?: string | null;
  participants_count: number;
  stages: PublicEventStage[];
}

export interface PublicCompetitionResult {
  id: number;
  result_value?: string | null;
  result_unit?: string | null;
  position?: number | null;
  tiebreak_order?: number | null;
  status: string;
  lane?: number | null;
  start_order?: number | null;

  participant?: {
    type: 'player' | 'team';
    id: number;
    name: string;
  } | null;

  attempts: {
    id: number;
    attempt_number: number;
    value: string;
  }[];
}

export const publicApi = {
    search: (query: string) =>
        apiPublic.get<{ success: boolean; data: SearchResults; message: string }>('/public/search', { 
            params: { q: query } 
        }),

    getDisciplines: () =>
        apiPublic.get<{ success: boolean; data: PublicDiscipline[]; message: string }>('/public/disciplines'),

    getCategories: (params?: { discipline_id?: number }) =>
        apiPublic.get<{ success: boolean; data: PublicCategory[]; message: string }>('/public/categories', { params }),

    getChampionships: (params?: { discipline_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicChampionship[] }; message: string }>('/public/championships', { 
            params 
        }),

    getChampionship: (id: number, params?: { year?: number }) =>
        apiPublic.get<{ success: boolean; data: { championship: PublicChampionship; stats: ChampionshipStats }; message: string }>(
            `/public/championships/${id}`, 
            { params }
        ),

    getChampionshipStandings: (id: number) =>
        apiPublic.get<{ success: boolean; data: PublicStanding[]; message: string }>(
            `/public/championships/${id}/standings`
        ),

    getChampionshipMatches: (id: number, params?: { 
        page?: number; 
        status?: string; 
        category_id?: number; 
        discipline_id?: number 
    }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicMatch[]; meta?: any }; message: string }>(
            `/public/championships/${id}/matches`,
            { params }
        ),

    getChampionshipStatistics: (id: number) =>
        apiPublic.get<{ success: boolean; data: ChampionshipStats; message: string }>(
            `/public/championships/${id}/statistics`
        ),

    getChampionshipStandingsComplete: (id: number, params?: { category_id?: number; discipline_id?: number }) =>
        apiPublic.get<{ success: boolean; data: PublicStanding[]; message: string }>(
            `/public/championships/${id}/standings-complete`,
            { params }
        ),

    getChampionshipDisciplines: (id: number) =>
        apiPublic.get<{ success: boolean; data: PublicChampionshipDiscipline[]; message: string }>(
            `/public/championships/${id}/disciplines`
        ),

    getChampionshipCategories: (id: number, params?: { discipline_id?: number }) =>
        apiPublic.get<{ success: boolean; data: PublicCategory[]; message: string }>(
            `/public/championships/${id}/categories`,
            { params }
        ),
    
    getMatches: (params?: { discipline_id?: number; status?: string; championship_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicMatch[] }; message: string }>('/public/matches', { 
            params 
        }),

    getLiveMatches: () =>
        apiPublic.get<{ success: boolean; data: PublicMatch[]; message: string }>('/public/matches/live'),

    getHighlightedMatches: () =>
        apiPublic.get<{ success: boolean; data: PublicMatch[]; message: string }>('/public/matches/highlighted'),

    getMatch: (id: number) =>
        apiPublic.get<{ success: boolean; data: any; message: string }>(`/public/matches/${id}`),

    getTeams: (params?: { championship_id?: number; search?: string; page?: number; year?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicTeam[] }; message: string }>('/public/teams', { 
            params 
        }),

    getChampionshipTeams: (params?: { championship_id?: number; search?: string; page?: number; year?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicTeam[] }; message: string }>('/public/championshipTeams', { 
            params 
        }),

    getTeam: (id: number) =>
        apiPublic.get<{ success: boolean; data: PublicTeamDetail; message: string }>(`/public/teams/${id}`),
    
    getPlayers: (params?: { team_id?: number; championship_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicPlayer[] }; message: string }>('/public/players', { 
            params 
        }),

    getPlayer: (id: number) =>
        apiPublic.get<{ success: boolean; data: any; message: string }>(`/public/players/${id}`),

    getCompetitionEvents: (params?: {
        championship_id?: number;
        discipline_id?: number;
        category_id?: number;
        status?: string;
    }) =>
    apiPublic.get('/public/competition-events', { params }),

    getHighlightedEvents: () => apiPublic.get('/public/competition-events/highlighted'),

    getCompetitionEvent: (id: number) => apiPublic.get(`/public/competition-events/${id}`),

    getCompetitionGroupResults: (groupId: number) => apiPublic.get(`/public/competition-event-groups/${groupId}/results`),
};

export default apiPublic;