<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('group_teams', function (Blueprint $table) {
            $table->foreign('championship_team_id')
                ->references('id')
                ->on('championship_teams')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('group_teams', function (Blueprint $table) {
            $table->dropForeign(['championship_team_id']);
        });
    }
};