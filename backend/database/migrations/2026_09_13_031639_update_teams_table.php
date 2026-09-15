<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
Esta migración hace lo siguiente:
   1. Agrega user_id y discipline_id a teams.
   2. Llena user_id para los equipos existentes.
   3. Llena discipline_id para los equipos existentes.
   4. Elimina championship_id y category_id.
   5. Elimina representative y registration_status.
*/
return new class extends Migration
{
    public function up(): void
    {
        /*
         * 1. Agregar las nuevas columnas temporalmente como nullable.
         *
         * Son nullable porque los equipos existentes todavía
         * no tienen estos valores.
         */
        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('discipline_id')
                ->nullable()
                ->after('user_id')
                ->constrained('disciplines')
                ->nullOnDelete();
        });

        /*
         * 2. Llenar user_id para los equipos existentes.
         *
         * Relación:
         *
         * Team
         *   -> championship_id
         *      -> Championship
         *         -> user_id
         */
        DB::statement('
            UPDATE teams
            INNER JOIN championships
                ON championships.id = teams.championship_id
            SET teams.user_id = championships.user_id
        ');

        /*
         * 3. Llenar discipline_id para los equipos existentes.
         *
         * Relación:
         *
         * Team
         *   -> category_id
         *      -> Category
         *         -> championship_discipline_id
         *            -> ChampionshipDiscipline
         *               -> discipline_id
         */
        DB::statement('
            UPDATE teams
            INNER JOIN categories
                ON categories.id = teams.category_id
            INNER JOIN championship_disciplines
                ON championship_disciplines.id =
                   categories.championship_discipline_id
            SET teams.discipline_id =
                championship_disciplines.discipline_id
        ');

        /*
         * 4. Eliminar las foreign keys antiguas.
         */
        Schema::table('teams', function (Blueprint $table) {
            $table->dropForeign(['championship_id']);
            $table->dropForeign(['category_id']);
        });

        /*
         * 5. Eliminar columnas antiguas.
         */
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn([
                'championship_id',
                'category_id',
                'representative',
                'registration_status',
            ]);
        });
    }

    public function down(): void
    {
        /*
         * Restaurar columnas eliminadas.
         *
         * Los valores originales de championship_id y category_id
         * no pueden recuperarse automáticamente después de eliminarlos.
         */
        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('championship_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('representative')->nullable();

            $table->string('registration_status')
                ->default('pendiente');
        });

        /*
         * Eliminar discipline_id y user_id.
         */
        Schema::table('teams', function (Blueprint $table) {
            $table->dropForeign(['discipline_id']);
            $table->dropForeign(['user_id']);

            $table->dropColumn([
                'discipline_id',
                'user_id',
            ]);
        });
    }
};