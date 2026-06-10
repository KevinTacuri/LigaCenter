<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('dni')->unique()->nullable();
            $table->string('college_id')->nullable();
            $table->integer('age')->nullable();
            $table->boolean('is_eligible')->default(true);

            $table->integer('total_goals')->default(0);
            $table->integer('total_yellow_cards')->default(0);
            $table->integer('total_red_cards')->default(0);
            $table->integer('total_matches_played')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};