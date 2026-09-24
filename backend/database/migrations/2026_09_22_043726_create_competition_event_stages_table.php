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
        Schema::create('competition_event_stages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('competition_event_id')
                ->constrained('competition_events')
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('stage_type', 30);
            // qualifying
            // semifinal
            // final
            // round
            $table->unsignedInteger('qualifiers_count')
                ->nullable();

            $table->string('qualification_method', 30)
                ->nullable();

            $table->unsignedInteger('stage_number');

            $table->string('status', 30)
                ->default('programado');

            $table->timestamps();

            $table->unique(
                [
                    'competition_event_id',
                    'stage_number',
                ],
                'event_stage_number_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_event_stages');
    }
};
