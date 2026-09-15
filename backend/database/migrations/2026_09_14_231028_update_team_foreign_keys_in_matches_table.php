<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Quitar las restricciones antiguas con la tabla 'teams'
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['home_team_id']);
            $table->dropForeign(['away_team_id']);
        });

        // 2. Mapear los datos de 'teams.id' al 'championship_teams.id' pasando por 'championship_disciplines'
        DB::statement("
            UPDATE matches m
            INNER JOIN championship_disciplines cd ON cd.championship_id = m.championship_id
            INNER JOIN championship_teams ct ON ct.team_id = m.home_team_id 
                                            AND ct.championship_discipline_id = cd.id
            SET m.home_team_id = ct.id
            WHERE m.home_team_id IS NOT NULL
        ");

        DB::statement("
            UPDATE matches m
            INNER JOIN championship_disciplines cd ON cd.championship_id = m.championship_id
            INNER JOIN championship_teams ct ON ct.team_id = m.away_team_id 
                                            AND ct.championship_discipline_id = cd.id
            SET m.away_team_id = ct.id
            WHERE m.away_team_id IS NOT NULL
        ");

        // 3. Prevenir fallos fijando en NULL cualquier ID que no coincida con la nueva tabla
        DB::statement("
            UPDATE matches 
            SET home_team_id = NULL 
            WHERE home_team_id IS NOT NULL 
              AND home_team_id NOT IN (SELECT id FROM championship_teams)
        ");

        DB::statement("
            UPDATE matches 
            SET away_team_id = NULL 
            WHERE away_team_id IS NOT NULL 
              AND away_team_id NOT IN (SELECT id FROM championship_teams)
        ");

        // 4. Crear las nuevas claves foráneas apuntando a 'championship_teams'
        Schema::table('matches', function (Blueprint $table) {
            $table->foreign('home_team_id')
                ->references('id')
                ->on('championship_teams')
                ->onDelete('cascade');

            $table->foreign('away_team_id')
                ->references('id')
                ->on('championship_teams')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Quitar claves foráneas nuevas
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['home_team_id']);
            $table->dropForeign(['away_team_id']);
        });

        // Revertir los IDs de 'championship_teams.id' de regreso a 'team_id'
        DB::statement("
            UPDATE matches m
            INNER JOIN championship_teams ct ON ct.id = m.home_team_id
            SET m.home_team_id = ct.team_id
            WHERE m.home_team_id IS NOT NULL
        ");

        DB::statement("
            UPDATE matches m
            INNER JOIN championship_teams ct ON ct.id = m.away_team_id
            SET m.away_team_id = ct.team_id
            WHERE m.away_team_id IS NOT NULL
        ");

        // Reinstaurar claves foráneas antiguas hacia 'teams'
        Schema::table('matches', function (Blueprint $table) {
            $table->foreign('home_team_id')
                ->references('id')
                ->on('teams')
                ->onDelete('cascade');

            $table->foreign('away_team_id')
                ->references('id')
                ->on('teams')
                ->onDelete('cascade');
        });
    }
};