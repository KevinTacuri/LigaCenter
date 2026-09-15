<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Championship;
use App\Models\Discipline;
use App\Models\ChampionshipDiscipline;
use App\Models\Category;
use App\Models\Venue;
use App\Models\Team;
use App\Models\GameMatch;
use App\Models\ChampionshipTeam;
use App\Models\ChampionshipPlayer;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $organizador = User::where('email', 'organizador@ligacenter.com')->first();
        if (!$organizador) {
            $this->command->error('Usuario organizador no encontrado.');
            return;
        }

        // 1. Crear Campeonato de prueba
        $championship = Championship::firstOrCreate(
            ['name' => 'Campeonato Apertura 2026 - Colegio de Ingenieros'],
            [
                'description' => 'Campeonato oficial de apertura con múltiples disciplinas y categorías.',
                'start_date' => '2026-06-01',
                'end_date' => '2026-12-15',
                'status' => 'activo',
                'user_id' => $organizador->id,
            ]
        );

        // Asociar usuario organizador al campeonato en championship_users
        \DB::table('championship_users')->updateOrInsert(
            [
                'championship_id' => $championship->id,
                'user_id' => $organizador->id,
            ],
            [
                'role' => 'organizador',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 2. Disciplinas del catálogo
        $futbol = Discipline::where('name', 'LIKE', '%futbol%')->first() ?? Discipline::firstOrCreate(['name' => 'Fútbol']);
        $basquet = Discipline::where('name', 'LIKE', '%basquet%')->first() ?? Discipline::firstOrCreate(['name' => 'Básquet']);

        // 3. Asociar Disciplinas al Campeonato con sus configuraciones de tiempo
        $champFutbol = ChampionshipDiscipline::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'discipline_id' => $futbol->id,
            ],
            [
                'specific_rules' => 'Tiempos cortos de 20 minutos por tiempo.',
                'match_duration_minutes' => 20,
                'match_duration_settings' => json_encode([
                    'period_duration_minutes' => 20,
                    'number_of_periods' => 2,
                    'overtime_duration_minutes' => 10,
                ]),
            ]
        );

        $champBasquet = ChampionshipDiscipline::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'discipline_id' => $basquet->id,
            ],
            [
                'specific_rules' => 'Cuartos de 10 minutos de juego.',
                'match_duration_minutes' => 10,
                'match_duration_settings' => json_encode([
                    'period_duration_minutes' => 10,
                    'number_of_periods' => 4,
                    'overtime_duration_minutes' => 5,
                ]),
            ]
        );

        // 4. Categorías
        $catFutbolLibre = Category::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'name' => 'Fútbol Libre Masculino',
            ],
            [
                'gender_type' => 'masculino',
                'format' => 'liga',
            ]
        );

        $catFutbolMaster = Category::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'name' => 'Fútbol Máster +40',
            ],
            [
                'gender_type' => 'masculino',
                'format' => 'liga',
                'age_min' => 40,
            ]
        );

        $catBasquet = Category::firstOrCreate(
            [
                'championship_discipline_id' => $champBasquet->id,
                'name' => 'Básquet Libre Masculino',
            ],
            [
                'gender_type' => 'masculino',
                'format' => 'liga',
            ]
        );

        // 5. Sedes / Venues
        $cancha1 = Venue::firstOrCreate(
            ['name' => 'Complejo Deportivo Cancha 1', 'championship_id' => $championship->id],
            ['location' => 'Av. Independencia 123', 'venue_type' => 'cancha']
        );
        $cancha2 = Venue::firstOrCreate(
            ['name' => 'Coliseo Cerrado Central', 'championship_id' => $championship->id],
            ['location' => 'Av. Parra 456', 'venue_type' => 'coliseo']
        );

        // 6. Equipos
        $eq1 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Agrounsa FC'], ['discipline_id' => $futbol->id]);
        $eq2 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Deportivo Minas'], ['discipline_id' => $futbol->id]);
        $eq3 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Atlético Civil'], ['discipline_id' => $futbol->id]);
        $eq4 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Real Sistemas'], ['discipline_id' => $futbol->id]);
        $eq5 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Club Industrial'], ['discipline_id' => $futbol->id]);
        $eq6 = Team::firstOrCreate(['user_id' => $organizador->id, 'name' => 'Sporting Mecánica'], ['discipline_id' => $basquet->id]);

        // Asociar equipos a categorías y campeonatos a través de ChampionshipTeam 
        $championshipTeam1 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'team_id' => $eq1->id,
            ],
            [
                'category_id' => $catFutbolLibre->id,
                'representative' => $eq1->representative,
            ]
        );
        $championshipTeam2 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'team_id' => $eq2->id,
            ],
            [
                'category_id' => $catFutbolLibre->id,
                'representative' => $eq2->representative,
            ]
        );
        $championshipTeam3 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'team_id' => $eq3->id,
            ],
            [
                'category_id' => $catFutbolLibre->id,
                'representative' => $eq3->representative,
            ]
        );
        $championshipTeam4 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'team_id' => $eq4->id,
            ],
            [
                'category_id' => $catFutbolLibre->id,
                'representative' => $eq4->representative,
            ]
        );
        $championshipTeam5 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champFutbol->id,
                'team_id' => $eq5->id,
            ],
            [
                'category_id' => $catFutbolLibre->id,
                'representative' => $eq5->representative,
            ]
        );
        $championshipTeam6 = ChampionshipTeam::firstOrCreate(
            [
                'championship_discipline_id' => $champBasquet->id,
                'team_id' => $eq6->id,
            ],
            [
                'category_id' => $catBasquet->id,
                'representative' => $eq6->representative,
            ]
        );

        // 6.1 Agregar jugadores a los equipos (ejemplo de jugadores)
        $playersData = [
            ['team' => $eq1, 'names' => 'Juan', 'last_names' => 'Pérez', 'age' => 25, 'position' => 'Delantero', 'jersey_number' => 9, 'document_number' => '12345678'],
            ['team' => $eq1, 'names' => 'Carlos', 'last_names' => 'López', 'age' => 28, 'position' => 'Mediocampista', 'jersey_number' => 8, 'document_number' => '87654321'],
            ['team' => $eq2, 'names' => 'Miguel', 'last_names' => 'Torres', 'age' => 30, 'position' => 'Defensa', 'jersey_number' => 4, 'document_number' => '11223344'],
            ['team' => $eq2, 'names' => 'Luis', 'last_names' => 'Ramírez', 'age' => 27, 'position' => 'Portero', 'jersey_number' => 1, 'document_number' => '44332211'],
            ['team' => $eq3, 'names' => 'Andrés', 'last_names' => 'Gómez', 'age' => 26, 'position' => 'Delantero', 'jersey_number' => 10, 'document_number' => '55667788'],
            ['team' => $eq3, 'names' => 'Jorge', 'last_names' => 'Castillo', 'age' => 29, 'position' => 'Mediocampista', 'jersey_number' => 7, 'document_number' => '99887766'],
        ];

        foreach ($playersData as $playerData) {
            $player = \App\Models\Player::firstOrCreate(
                [
                    'names' => $playerData['names'],
                    'last_names' => $playerData['last_names'],
                    'document_number' => $playerData['document_number']
                ],
                [
                    'birth_date' => now()->subYears($playerData['age'])->toDateString(),
                ]
            );

            // Asociar jugador al campeonato a través de ChampionshipPlayer
            ChampionshipPlayer::firstOrCreate(
                [
                    'championship_team_id' => ChampionshipTeam::where('team_id', $playerData['team']->id)->first()->id,
                    'player_id' => $player->id,
                ],
                [
                    'jersey_number' => $playerData['jersey_number'],
                    'position' => $playerData['position'],
                    'is_captain' => false,
                ]
            );
        }


        // 7. Partidos de Prueba
        // Partido 1: En juego (Fútbol Libre)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catFutbolLibre->id,
                'home_team_id' => $championshipTeam1->id,
                'away_team_id' => $championshipTeam2->id,
                'round' => 1,
            ],
            [
                'discipline_id' => $futbol->id,
                'venue_id' => $cancha1->id,
                'match_date' => now()->toDateString(),
                'match_time' => '14:00:00',
                'status' => 'en_curso',
                'home_score' => 2,
                'away_score' => 1,
                'current_elapsed_time' => 450,
                'current_period' => 1,
                'timer_status' => 'running',
            ]
        );

        // Partido 2: Pendiente (Fútbol Libre)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catFutbolLibre->id,
                'home_team_id' => $championshipTeam3->id,
                'away_team_id' => $championshipTeam4->id,
                'round' => 1,
            ],
            [
                'discipline_id' => $futbol->id,
                'venue_id' => $cancha1->id,
                'match_date' => now()->toDateString(),
                'match_time' => '15:30:00',
                'status' => 'programado',
                'home_score' => 0,
                'away_score' => 0,
            ]
        );

        // Partido 3: Pendiente (Fútbol Máster)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catFutbolMaster->id,
                'home_team_id' => $championshipTeam5->id,
                'away_team_id' => $championshipTeam6->id,
                'round' => 1,
            ],
            [
                'discipline_id' => $futbol->id,
                'venue_id' => $cancha1->id,
                'match_date' => now()->addDays(1)->toDateString(),
                'match_time' => '10:00:00',
                'status' => 'programado',
                'home_score' => 0,
                'away_score' => 0,
            ]
        );

        // Partido 4: Pendiente (Básquet Libre)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catBasquet->id,
                'home_team_id' => $championshipTeam1->id,
                'away_team_id' => $championshipTeam3->id,
                'round' => 1,
            ],
            [
                'discipline_id' => $basquet->id,
                'venue_id' => $cancha2->id,
                'match_date' => now()->toDateString(),
                'match_time' => '16:00:00',
                'status' => 'programado',
                'home_score' => 0,
                'away_score' => 0,
            ]
        );

        // Partido 5: Finalizado (Fútbol Libre)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catFutbolLibre->id,
                'home_team_id' => $championshipTeam5->id,
                'away_team_id' => $championshipTeam2->id,
                'round' => 2,
            ],
            [
                'discipline_id' => $futbol->id,
                'venue_id' => $cancha1->id,
                'match_date' => now()->subDays(2)->toDateString(),
                'match_time' => '12:00:00',
                'status' => 'finalizado',
                'home_score' => 3,
                'away_score' => 2,
            ]
        );

        $this->command->info('¡Registros de prueba creados exitosamente para el usuario Organizador!');
    }
}
