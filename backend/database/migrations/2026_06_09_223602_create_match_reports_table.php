<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained('matches')->onDelete('cascade');
            $table->integer('home_score')->default(0);
            $table->integer('away_score')->default(0);
            $table->string('referee_signature')->nullable();
            $table->string('delegate_signature')->nullable();
            $table->string('official_pdf_url')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->string('sport_type')->default('futbol');
            
            // VÓLEY - Sets
            $table->integer('set1_home')->nullable();
            $table->integer('set1_away')->nullable();
            $table->integer('set2_home')->nullable();
            $table->integer('set2_away')->nullable();
            $table->integer('set3_home')->nullable();
            $table->integer('set3_away')->nullable();
            $table->integer('set4_home')->nullable();
            $table->integer('set4_away')->nullable();
            $table->integer('set5_home')->nullable();
            $table->integer('set5_away')->nullable();
            
            // BÁSQUET - Cuartos
            $table->integer('quarter1_home')->nullable();
            $table->integer('quarter1_away')->nullable();
            $table->integer('quarter2_home')->nullable();
            $table->integer('quarter2_away')->nullable();
            $table->integer('quarter3_home')->nullable();
            $table->integer('quarter3_away')->nullable();
            $table->integer('quarter4_home')->nullable();
            $table->integer('quarter4_away')->nullable();
            $table->integer('overtime_home')->nullable();
            $table->integer('overtime_away')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_reports');
    }
};