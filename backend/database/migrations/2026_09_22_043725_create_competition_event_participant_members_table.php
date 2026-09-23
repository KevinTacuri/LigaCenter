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
        Schema::create(
            'competition_event_participant_members',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'competition_event_participant_id'
                );

                $table->foreign(
                    'competition_event_participant_id',
                    'event_part_member_fk'
                )
                    ->references('id')
                    ->on('competition_event_participants')
                    ->cascadeOnDelete();

                $table->foreignId('championship_player_id');

                $table->foreign(
                    'championship_player_id',
                    'event_part_member_player_fk'
                )
                    ->references('id')
                    ->on('championship_players')
                    ->cascadeOnDelete();

                $table->timestamps();

                $table->unique(
                    [
                        'competition_event_participant_id',
                        'championship_player_id',
                    ],
                    'event_participant_member_unique'
                );
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_event_participant_members');
    }
};
