<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sanctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->foreignId('match_id')->constrained()->onDelete('cascade');
            $table->string('sanction_type');
            $table->text('reason');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('matches_suspended')->default(1);
            $table->string('status')->default('activa');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sanctions');
    }
};