<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('venue_id')->constrained()->onDelete('cascade');
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->constrained('teams')->onDelete('cascade');
            $table->date('match_date');
            $table->string('match_time')->nullable();
            $table->integer('round')->nullable();
            $table->string('phase')->nullable();
            $table->foreignId('group_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('status')->default('programado');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            
            // Cronómetro
            $table->integer('elapsed_time')->default(0);
            $table->string('clock_status')->default('stopped');
            $table->integer('current_period')->default(0);
            $table->timestamp('clock_last_updated')->nullable();
            
            // DEPORTE
            $table->string('sport_type')->default('futbol');
            
            // VÓLEY - Puntuación por sets (hasta 5 sets)
            $table->integer('set1_home')->nullable()->comment('Puntos set 1 local');
            $table->integer('set1_away')->nullable()->comment('Puntos set 1 visita');
            $table->integer('set2_home')->nullable();
            $table->integer('set2_away')->nullable();
            $table->integer('set3_home')->nullable();
            $table->integer('set3_away')->nullable();
            $table->integer('set4_home')->nullable();
            $table->integer('set4_away')->nullable();
            $table->integer('set5_home')->nullable();
            $table->integer('set5_away')->nullable();
            
            // BÁSQUET - Puntuación por cuartos (hasta 5 cuartos)
            $table->integer('quarter1_home')->nullable();
            $table->integer('quarter1_away')->nullable();
            $table->integer('quarter2_home')->nullable();
            $table->integer('quarter2_away')->nullable();
            $table->integer('quarter3_home')->nullable();
            $table->integer('quarter3_away')->nullable();
            $table->integer('quarter4_home')->nullable();
            $table->integer('quarter4_away')->nullable();
            $table->integer('overtime_home')->nullable();
            $table->integer('overtime_away')->nullable();
            
            // PUNTUACIÓN ACTUAL DEL PERIODO
            $table->integer('current_period_score_home')->default(0);
            $table->integer('current_period_score_away')->default(0);
            $table->boolean('is_period_finished')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};