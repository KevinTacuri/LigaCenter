<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('group_teams', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
        });

        Schema::table('group_teams', function (Blueprint $table) {
            $table->dropColumn('team_id');
        });

        Schema::table('group_teams', function (Blueprint $table) {
            $table->foreignId('championship_team_id')
                ->after('group_id')
                ->constrained('championship_teams')
                ->onDelete('cascade');
        });

        // Crear el índice único después de eliminar team_id
        Schema::table('group_teams', function (Blueprint $table) {
            $table->unique(
                ['group_id', 'championship_team_id'],
                'group_teams_group_id_championship_team_id_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('group_teams', function (Blueprint $table) {
            $table->dropUnique(
                'group_teams_group_id_championship_team_id_unique'
            );

            $table->dropForeign(['championship_team_id']);

            $table->dropColumn('championship_team_id');
        });

        Schema::table('group_teams', function (Blueprint $table) {
            $table->foreignId('team_id')
                ->after('group_id')
                ->constrained('teams')
                ->onDelete('cascade');
        });

        Schema::table('group_teams', function (Blueprint $table) {
            $table->unique(
                ['group_id', 'team_id'],
                'group_teams_group_id_team_id_unique'
            );
        });
    }
};