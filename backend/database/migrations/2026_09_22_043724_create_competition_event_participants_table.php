<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('competition_event_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('competition_event_id')
                ->constrained('competition_events')
                ->cascadeOnDelete();

            $table->foreignId('championship_player_id')
                ->nullable()
                ->constrained('championship_players')
                ->cascadeOnDelete();

            $table->foreignId('championship_team_id')
                ->nullable()
                ->constrained('championship_teams')
                ->nullOnDelete();

            $table->string('status')->default('inscrito');

            $table->timestamps();

            $table->unique(
                ['competition_event_id', 'championship_player_id'],
                'event_participant_player_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_event_participants');
    }
};
