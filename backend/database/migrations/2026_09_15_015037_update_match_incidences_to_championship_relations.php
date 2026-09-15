<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Crear las nuevas columnas
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->foreignId('championship_player_id')
                ->nullable()
                ->after('match_id');

            $table->foreignId('championship_team_id')
                ->nullable()
                ->after('championship_player_id');
        });

        // 2. Migrar player_id -> championship_player_id
        //
        // championship_player pertenece a championship_team,
        // y championship_team pertenece a championship_discipline.
        //
        // Así podemos determinar el ChampionshipPlayer correcto
        // según el campeonato del partido.
        DB::statement('
            UPDATE match_incidences mi
            INNER JOIN matches m
                ON m.id = mi.match_id
            INNER JOIN championship_players cp
                ON cp.player_id = mi.player_id
            INNER JOIN championship_teams ct
                ON ct.id = cp.championship_team_id
            INNER JOIN championship_disciplines cd
                ON cd.id = ct.championship_discipline_id
                AND cd.championship_id = m.championship_id
            SET mi.championship_player_id = cp.id
            WHERE mi.player_id IS NOT NULL
        ');

        // 3. Migrar team_id -> championship_team_id
        //
        // Se busca el equipo correspondiente al campeonato
        // donde se registró el partido.
        DB::statement('
            UPDATE match_incidences mi
            INNER JOIN matches m
                ON m.id = mi.match_id
            INNER JOIN championship_teams ct
                ON ct.team_id = mi.team_id
            INNER JOIN championship_disciplines cd
                ON cd.id = ct.championship_discipline_id
                AND cd.championship_id = m.championship_id
            SET mi.championship_team_id = ct.id
            WHERE mi.team_id IS NOT NULL
        ');

        // 4. Eliminar las FK antiguas
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->dropForeign(['player_id']);
            $table->dropForeign(['team_id']);
        });

        // 5. Eliminar las columnas antiguas
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->dropColumn([
                'player_id',
                'team_id',
            ]);
        });

        // 6. Crear las nuevas FK
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->foreign('championship_player_id')
                ->references('id')
                ->on('championship_players')
                ->nullOnDelete();

            $table->foreign('championship_team_id')
                ->references('id')
                ->on('championship_teams')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // 1. Volver a crear las columnas antiguas
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->foreignId('player_id')
                ->nullable()
                ->after('match_id');

            $table->foreignId('team_id')
                ->nullable()
                ->after('player_id');
        });

        // 2. Restaurar championship_player_id -> player_id
        DB::statement('
            UPDATE match_incidences mi
            INNER JOIN championship_players cp
                ON cp.id = mi.championship_player_id
            SET mi.player_id = cp.player_id
            WHERE mi.championship_player_id IS NOT NULL
        ');

        // 3. Restaurar championship_team_id -> team_id
        DB::statement('
            UPDATE match_incidences mi
            INNER JOIN championship_teams ct
                ON ct.id = mi.championship_team_id
            SET mi.team_id = ct.team_id
            WHERE mi.championship_team_id IS NOT NULL
        ');

        // 4. Eliminar las nuevas FK
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->dropForeign(['championship_player_id']);
            $table->dropForeign(['championship_team_id']);
        });

        // 5. Eliminar las columnas nuevas
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->dropColumn([
                'championship_player_id',
                'championship_team_id',
            ]);
        });

        // 6. Restaurar las FK originales
        Schema::table('match_incidences', function (Blueprint $table) {
            $table->foreign('player_id')
                ->references('id')
                ->on('players')
                ->nullOnDelete();

            $table->foreign('team_id')
                ->references('id')
                ->on('teams')
                ->cascadeOnDelete();
        });
    }
};