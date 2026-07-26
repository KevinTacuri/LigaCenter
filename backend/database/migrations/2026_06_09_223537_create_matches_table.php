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
            $table->foreignId('discipline_id')->nullable()->constrained('disciplines')->onDelete('set null');
            $table->foreignId('home_team_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->nullable()->constrained('teams')->onDelete('cascade');
            
            // NUEVAS COLUMNAS PARA EL CONTROL DE LLAVES Y CONECTORES ESTILO SOFASCORE
            $table->unsignedBigInteger('parent_home_match_id')->nullable();
            $table->unsignedBigInteger('parent_away_match_id')->nullable();
            $table->string('placeholder_text_home')->nullable();
            $table->string('placeholder_text_away')->nullable();

            $table->date('match_date');
            $table->string('match_time')->nullable();
            $table->integer('round')->nullable();
            $table->string('phase')->nullable();
            $table->foreignId('group_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('status')->default('programado');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->integer('current_elapsed_time')->default(0);
            $table->integer('current_period')->default(0);
            $table->string('timer_status')->default('stopped');
            $table->timestamp('timer_started_at')->nullable();
            
            // ===== NUEVOS CAMPOS PARA TIEMPO EXTRA =====
            $table->integer('extra_time_minutes')->default(0);
            $table->boolean('has_extra_time')->default(false);
            $table->integer('max_extra_time')->default(5);
            
            $table->timestamps();
            $table->softDeletes();
            
            // NUEVAS RELACIONES: Claves foráneas auto-referenciales
            $table->foreign('parent_home_match_id')->references('id')->on('matches')->onDelete('set null');
            $table->foreign('parent_away_match_id')->references('id')->on('matches')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};