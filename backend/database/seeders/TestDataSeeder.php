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
        $eq1 = Team::firstOrCreate(['name' => 'Agrounsa FC', 'championship_id' => $championship->id], ['category_id' => $catFutbolLibre->id, 'representative' => 'Juan Perez']);
        $eq2 = Team::firstOrCreate(['name' => 'Deportivo Minas', 'championship_id' => $championship->id], ['category_id' => $catFutbolLibre->id, 'representative' => 'Carlos Lopez']);
        $eq3 = Team::firstOrCreate(['name' => 'Atlético Civil', 'championship_id' => $championship->id], ['category_id' => $catFutbolLibre->id, 'representative' => 'Mario Gomez']);
        $eq4 = Team::firstOrCreate(['name' => 'Real Sistemas', 'championship_id' => $championship->id], ['category_id' => $catFutbolLibre->id, 'representative' => 'Luis Torres']);
        $eq5 = Team::firstOrCreate(['name' => 'Club Industrial', 'championship_id' => $championship->id], ['category_id' => $catFutbolMaster->id, 'representative' => 'Pedro Ramirez']);
        $eq6 = Team::firstOrCreate(['name' => 'Sporting Mecánica', 'championship_id' => $championship->id], ['category_id' => $catBasquet->id, 'representative' => 'Jorge Diaz']);

        // 7. Partidos de Prueba
        // Partido 1: En juego (Fútbol Libre)
        GameMatch::firstOrCreate(
            [
                'championship_id' => $championship->id,
                'category_id' => $catFutbolLibre->id,
                'home_team_id' => $eq1->id,
                'away_team_id' => $eq2->id,
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
                'home_team_id' => $eq3->id,
                'away_team_id' => $eq4->id,
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
                'home_team_id' => $eq5->id,
                'away_team_id' => $eq6->id,
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
                'home_team_id' => $eq1->id,
                'away_team_id' => $eq3->id,
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
                'home_team_id' => $eq5->id,
                'away_team_id' => $eq2->id,
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
