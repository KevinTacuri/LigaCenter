<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('standings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('championship_team_id')->constrained('championship_teams')->onDelete('cascade');
            
            // Campos base (todos los deportes)
            $table->integer('matches_played')->default(0);
            $table->integer('points')->default(0);
            
            // Fútbol / Balonmano
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);
            $table->integer('goals_for')->default(0);
            $table->integer('goals_against')->default(0);
            $table->integer('goal_difference')->default(0);
            
            // Vóley
            $table->integer('wins_total')->default(0);
            $table->integer('losses_total')->default(0);
            $table->integer('sets_for')->default(0);
            $table->integer('sets_against')->default(0);
            $table->decimal('sets_ratio', 8, 3)->default(0);
            $table->integer('points_for')->default(0);
            $table->integer('points_against')->default(0);
            $table->decimal('points_ratio', 8, 3)->default(0);
            
            // Básquet
            $table->decimal('win_percentage', 5, 2)->default(0);
            $table->decimal('games_behind', 5, 2)->default(0);
            $table->string('streak', 10)->nullable();
            
            $table->timestamp('last_updated')->useCurrent();

            $table->unique(['championship_id', 'category_id', 'championship_team_id'], 'standing_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('standings');
    }
};