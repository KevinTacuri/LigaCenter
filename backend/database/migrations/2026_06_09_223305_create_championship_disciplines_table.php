<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('championship_disciplines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('championship_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('discipline_id')
                ->constrained()
                ->cascadeOnDelete();
            
            $table->text('specific_rules')->nullable();

            $table->integer('match_duration_minutes')->default(45);
            $table->json('match_duration_settings')->nullable();

            $table->timestamps();

            $table->unique([
                'championship_id',
                'discipline_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('championship_disciplines');
    }
};