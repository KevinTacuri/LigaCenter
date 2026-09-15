<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('championship_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_team_id')->constrained('championship_teams')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('players')->restrictOnDelete();
            $table->unsignedSmallInteger('jersey_number')->nullable();
            $table->string('position', 50)->nullable();
            $table->boolean('is_captain')->default(false);
            $table->timestamps();

            $table->unique(['championship_team_id', 'player_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('championship_players');
    }
};