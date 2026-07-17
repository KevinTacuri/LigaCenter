<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('discipline_statistics', function (Blueprint $table) {

        $table->id();

        $table->foreignId('discipline_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->foreignId('statistic_type_id')
            ->constrained()
            ->cascadeOnDelete();
        
        $table->unsignedInteger('value')->default(0);

        $table->unsignedSmallInteger('order')->default(0);
        $table->timestamps();

        $table->unique([
            'discipline_id',
            'statistic_type_id'
        ]);
    });

    }

    public function down(): void
    {
        Schema::dropIfExists('discipline_statistics');
    }

};
