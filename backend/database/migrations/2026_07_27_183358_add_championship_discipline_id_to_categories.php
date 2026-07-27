<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La tabla categories originalmente tenía championship_discipline_id (FK a championship_disciplines)
        // pero en algún momento la BD se restauró con un esquema simplificado (championship_id + discipline_id directos).
        // Esta migration restaura el esquema original esperado por el modelo y los controladores.

        // 1. Crear championship_disciplines si no existe (por si también se borró)
        if (!Schema::hasTable('championship_disciplines')) {
            Schema::create('championship_disciplines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('championship_id')->constrained()->cascadeOnDelete();
                $table->foreignId('discipline_id')->constrained()->cascadeOnDelete();
                $table->text('specific_rules')->nullable();
                $table->integer('match_duration_minutes')->default(45);
                $table->json('match_duration_settings')->nullable();
                $table->timestamps();
                $table->unique(['championship_id', 'discipline_id']);
            });
        }

        // 2. Agregar championship_discipline_id a categories si no existe
        if (!Schema::hasColumn('categories', 'championship_discipline_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->foreignId('championship_discipline_id')
                    ->nullable()
                    ->after('discipline_id')
                    ->constrained()
                    ->cascadeOnDelete();
                $table->string('format')->default('liga')->after('name');
                $table->json('format_settings')->nullable()->after('format');
            });
        }

        // 3. Backfill: para cada categoría existente, crear/lookup championship_discipline
        //    y asignar el id a championship_discipline_id
        $categories = DB::table('categories')->whereNull('championship_discipline_id')->get();
        foreach ($categories as $cat) {
            $champDisc = DB::table('championship_disciplines')
                ->where('championship_id', $cat->championship_id)
                ->where('discipline_id', $cat->discipline_id)
                ->first();

            if (!$champDisc) {
                $champDiscId = DB::table('championship_disciplines')->insertGetId([
                    'championship_id' => $cat->championship_id,
                    'discipline_id' => $cat->discipline_id,
                    'match_duration_minutes' => 45,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $champDiscId = $champDisc->id;
            }

            DB::table('categories')
                ->where('id', $cat->id)
                ->update(['championship_discipline_id' => $champDiscId]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('categories', 'championship_discipline_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropForeign(['championship_discipline_id']);
                $table->dropColumn(['championship_discipline_id', 'format', 'format_settings']);
            });
        }
    }
};
