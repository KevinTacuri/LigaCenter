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
        Schema::create('competition_results', function (Blueprint $table) {
            $table->id();

            $table->foreignId('competition_event_group_participant_id');

            $table->foreign(
                'competition_event_group_participant_id',
                'comp_result_group_part_fk'
            )
                ->references('id')
                ->on('competition_event_group_participants')
                ->cascadeOnDelete();

            $table->decimal('result_value', 12, 4)->nullable();

            $table->string('result_unit')->nullable();

            $table->unsignedInteger('position')->nullable();

            $table->string('status', 30)->default('registrado');

            $table->timestamps();

            $table->unique(
                'competition_event_group_participant_id',
                'group_participant_result_unique'
            );
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_results');
    }
};
