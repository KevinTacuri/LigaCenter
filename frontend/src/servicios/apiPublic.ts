import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const apiPublic = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

// Interceptor para normalizar respuestas
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

// ============================================
// TIPOS DE DATOS PÚBLICOS
// ============================================

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
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
    form: string | null;
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

// ============================================
// SERVICIOS
// ============================================

export const publicApi = {
    // Búsqueda
    search: (query: string) =>
        apiPublic.get<{ success: boolean; data: SearchResults; message: string }>('/public/search', { 
            params: { q: query } 
        }),

    // Disciplinas
    getDisciplines: () =>
        apiPublic.get<{ success: boolean; data: PublicDiscipline[]; message: string }>('/public/disciplines'),

    // Campeonatos
    getChampionships: (params?: { discipline_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicChampionship[] }; message: string }>('/public/championships', { 
            params 
        }),

    getChampionship: (id: number) =>
        apiPublic.get<{ success: boolean; data: { championship: PublicChampionship; stats: ChampionshipStats }; message: string }>(
            `/public/championships/${id}`
        ),

    getChampionshipStandings: (id: number) =>
        apiPublic.get<{ success: boolean; data: PublicStanding[]; message: string }>(
            `/public/championships/${id}/standings`
        ),

    getChampionshipMatches: (id: number, page?: number) =>
        apiPublic.get<{ success: boolean; data: { data: PublicMatch[] }; message: string }>(
            `/public/championships/${id}/matches`, 
            { params: { page } }
        ),

    getChampionshipStatistics: (id: number) =>
        apiPublic.get<{ success: boolean; data: ChampionshipStats; message: string }>(
            `/public/championships/${id}/statistics`
        ),

    getChampionshipStandingsComplete: (id: number) =>
    apiPublic.get<{ success: boolean; data: PublicStanding[]; message: string }>(
        `/public/championships/${id}/standings-complete`
    ),
    
        // Partidos
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

    // Equipos
    getTeams: (params?: { championship_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicTeam[] }; message: string }>('/public/teams', { 
            params 
        }),

    getTeam: (id: number) =>
        apiPublic.get<{ success: boolean; data: any; message: string }>(`/public/teams/${id}`),

    // Jugadores
    getPlayers: (params?: { team_id?: number; championship_id?: number; search?: string; page?: number }) =>
        apiPublic.get<{ success: boolean; data: { data: PublicPlayer[] }; message: string }>('/public/players', { 
            params 
        }),

    getPlayer: (id: number) =>
        apiPublic.get<{ success: boolean; data: any; message: string }>(`/public/players/${id}`),
};

export default apiPublic;