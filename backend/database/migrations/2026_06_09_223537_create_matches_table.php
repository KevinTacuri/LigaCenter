<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('venue_id')->constrained()->onDelete('cascade');
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->constrained('teams')->onDelete('cascade');
            $table->date('match_date');
            $table->string('match_time')->nullable();
            $table->integer('round')->nullable();
            $table->string('phase')->nullable();
            $table->foreignId('group_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('status')->default('programado');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->integer('current_elapsed_time')->default(0);
            $table->integer('current_period')->default(0);
            $table->string('timer_status')->default('stopped');
            $table->timestamp('timer_started_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};