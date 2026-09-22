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

            $table->foreignId('competition_event_participant_id')
                ->constrained('competition_event_participants')
                ->cascadeOnDelete();

            $table->decimal('result_value', 12, 4)->nullable();

            $table->string('result_unit')->nullable();

            $table->unsignedInteger('position')->nullable();

            $table->string('status')->default('registrado');

            $table->timestamps();

            $table->unique('competition_event_participant_id');
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
