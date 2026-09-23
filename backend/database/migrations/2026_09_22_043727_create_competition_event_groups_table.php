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
        Schema::create('competition_event_groups', function (Blueprint $table) {
            $table->id();

            $table->foreignId('competition_event_stage_id')
                ->constrained('competition_event_stages')
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('group_type', 20);
            // series
            // group

            $table->unsignedInteger('group_number')
                ->default(1);

            $table->date('date')->nullable();

            $table->time('start_time')->nullable();

            $table->foreignId('venue_id')
                ->nullable()
                ->constrained('venues')
                ->nullOnDelete();

            $table->string('status', 30)
                ->default('programado');

            $table->timestamps();

            $table->unique(
                [
                    'competition_event_stage_id',
                    'group_number',
                ],
                'event_group_number_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_event_groups');
    }
};
