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
            'competition_event_group_participants',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'competition_event_group_id'
                );

                $table->foreignId(
                    'competition_event_participant_id'
                );

                $table->unsignedInteger('lane')
                    ->nullable();

                $table->unsignedInteger('start_order')
                    ->nullable();

                $table->string('status', 20)
                    ->default('activo');

                $table->timestamps();

                $table->foreign(
                    'competition_event_group_id',
                    'event_group_part_group_fk'
                )
                    ->references('id')
                    ->on('competition_event_groups')
                    ->cascadeOnDelete();

                $table->foreign(
                    'competition_event_participant_id',
                    'event_group_part_part_fk'
                )
                    ->references('id')
                    ->on('competition_event_participants')
                    ->cascadeOnDelete();

                $table->unique(
                    [
                        'competition_event_group_id',
                        'competition_event_participant_id',
                    ],
                    'group_participant_unique'
                );

                $table->unique(
                    [
                        'competition_event_group_id',
                        'lane',
                    ],
                    'competition_group_lane_unique'
                );
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_event_group_participants');
    }
};
