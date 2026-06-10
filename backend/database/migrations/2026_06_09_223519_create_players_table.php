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
            $table->string('document_number')->unique()->nullable();
            $table->string('names');
            $table->string('last_names');
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->string('photo')->nullable();
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