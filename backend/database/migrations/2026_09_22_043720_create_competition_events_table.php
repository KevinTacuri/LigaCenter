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
        Schema::create('competition_events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('championship_discipline_id')
                ->constrained('championship_disciplines')
                ->cascadeOnDelete();

            $table->foreignId('category_id')
                ->constrained('categories')
                ->cascadeOnDelete();

            $table->string('name');

            $table->enum('event_type', [
                'carrera',
                'salto',
                'lanzamiento',
                'puntaje',
            ])->default('puntaje');

            $table->date('date');
            $table->time('start_time')->nullable();

            $table->foreignId('venue_id')
                ->nullable()
                ->constrained('venues')
                ->nullOnDelete();

            $table->string('status')->default('programado');
            $table->string('participation_type', 20)
                ->default('individual');

            $table->enum('competition_format', [
                'single_final',
                'qualifying_final',
                'qualifying_semifinal_final',
                'custom',
            ])
            ->default('custom');

            $table->enum('result_aggregation', [
                'sum',
                'best',
                'average',
            ])
            ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_events');
    }
};
