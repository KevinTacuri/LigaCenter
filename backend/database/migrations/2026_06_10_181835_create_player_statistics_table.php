<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('discipline_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('tournament_id')->nullable();
            $table->integer('goals')->default(0);
            $table->integer('yellow_cards')->default(0);
            $table->integer('red_cards')->default(0);
            $table->integer('matches_played')->default(0);
            $table->timestamps();

            $table->unique(
                ['player_id', 'discipline_id', 'category_id', 'tournament_id'],
                'player_stats_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_statistics');
    }
};