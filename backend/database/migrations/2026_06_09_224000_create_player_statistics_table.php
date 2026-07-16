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
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('discipline_statistic_id')
                ->constrained('discipline_statistics')
                ->onDelete('cascade');

            $table->integer('value')->default(0);

            $table->timestamps();

            $table->unique(['player_id', 'team_id', 'championship_id', 'category_id', 'discipline_statistic_id'], 'player_stats_unique');

            $table->index(['championship_id', 'category_id']);
            $table->index('discipline_statistic_id');
            $table->index('player_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_statistics');
    }
};