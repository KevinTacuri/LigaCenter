<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('championship_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role');
            //$table->foreignId('team_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('championship_team_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();

            $table->unique(['championship_id', 'user_id', 'role'], 'champ_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('championship_users');
    }
};