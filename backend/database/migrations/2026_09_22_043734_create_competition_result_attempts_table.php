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
        Schema::create('competition_result_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('competition_result_id')
                ->constrained('competition_results')
                ->cascadeOnDelete();
            
            $table->foreignId(
                'competition_event_participant_member_id'
            )->nullable();

            $table->foreign(
                'competition_event_participant_member_id',
                'result_attempt_member_fk'
            )
                ->references('id')
                ->on('competition_event_participant_members')
                ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number');

            $table->decimal('value', 12, 4)->nullable();

            $table->timestamps();

            $table->index(
                [
                    'competition_result_id',
                    'competition_event_participant_member_id',
                ],
                'result_member_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_result_attempts');
    }
};
