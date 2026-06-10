<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->integer('jersey_number')->nullable();
            $table->string('status')->default('activo');
            $table->timestamps();

            $table->unique(['team_id', 'player_id'], 'team_player_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_players');
    }
};