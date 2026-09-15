<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('championship_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_discipline_id')->constrained('championship_disciplines')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained('teams')->restrictOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('representative')->nullable();
            $table->string('registration_status')->default('pendiente');

            $table->unique(['championship_discipline_id', 'team_id']);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('championship_teams');
    }
};
