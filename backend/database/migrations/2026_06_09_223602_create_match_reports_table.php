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
            $table->foreignId('match_id')->constrained()->onDelete('cascade');
            $table->integer('home_score')->default(0);
            $table->integer('away_score')->default(0);
            $table->string('referee_signature')->nullable();
            $table->string('delegate_signature')->nullable();
            $table->string('official_pdf_url')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_reports');
    }
};