<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            // Columnas que el código espera pero no existen en la BD actual
            if (!Schema::hasColumn('matches', 'discipline_id')) {
                $table->foreignId('discipline_id')->nullable()
                    ->after('category_id')
                    ->constrained('disciplines')->onDelete('set null');
            }
            if (!Schema::hasColumn('matches', 'parent_home_match_id')) {
                $table->unsignedBigInteger('parent_home_match_id')->nullable()->after('away_team_id');
                $table->unsignedBigInteger('parent_away_match_id')->nullable()->after('parent_home_match_id');
            }
            if (!Schema::hasColumn('matches', 'placeholder_text_home')) {
                $table->string('placeholder_text_home')->nullable()->after('parent_away_match_id');
                $table->string('placeholder_text_away')->nullable()->after('placeholder_text_home');
            }
            if (!Schema::hasColumn('matches', 'phase')) {
                $table->string('phase')->nullable()->after('round');
            }
            if (!Schema::hasColumn('matches', 'group_id')) {
                $table->foreignId('group_id')->nullable()
                    ->after('phase')
                    ->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('matches', 'home_score')) {
                $table->integer('home_score')->nullable()->after('status');
                $table->integer('away_score')->nullable()->after('home_score');
            }
            if (!Schema::hasColumn('matches', 'current_elapsed_time')) {
                $table->integer('current_elapsed_time')->default(0)->after('away_score');
                $table->integer('current_period')->default(0)->after('current_elapsed_time');
                $table->string('timer_status')->default('stopped')->after('current_period');
                $table->timestamp('timer_started_at')->nullable()->after('timer_status');
            }
            if (!Schema::hasColumn('matches', 'extra_time_minutes')) {
                $table->integer('extra_time_minutes')->default(0)->after('timer_started_at');
                $table->boolean('has_extra_time')->default(false)->after('extra_time_minutes');
                $table->integer('max_extra_time')->default(5)->after('has_extra_time');
            }
        });
    }

    public function down(): void
    {
        // No hay down porque el código depende de estas columnas
    }
};
