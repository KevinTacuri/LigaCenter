<?php

namespace Database\Seeders;

use App\Models\Discipline;
use App\Models\DisciplineStatistic;
use Illuminate\Database\Seeder;
use App\Models\StatisticType;

class DisciplineStatisticSeeder extends Seeder
{
    public function run(): void
    {
        $footballStatistics = [
            'goals',
            'assists',
            'yellow_cards',
            'red_cards',
            'matches_played',
        ];

        $volleyballStatistics = [
            'points',
            'blocks',
            'aces',
            'matches_played',
        ];

        $footballDisciplines = [
            'Fútbol 11',
            'Fútbol 8',
            'Fulbito',
        ];

        foreach ($footballDisciplines as $disciplineName) {

            $discipline = Discipline::where('name', $disciplineName)->first();

            if (!$discipline) {
                continue;
            }

            foreach ($footballStatistics as $index => $slug) {

                $type = StatisticType::where('slug', $slug)->first();

                DisciplineStatistic::firstOrCreate([
                    'discipline_id' => $discipline->id,
                    'statistic_type_id' => $type->id,
                ], [
                    'order' => $index + 1,
                ]);
            }
        }

        $volleyballDisciplines = [
            'Vóley',
            'Vóley Playa',
        ];

        foreach ($volleyballDisciplines as $disciplineName) {

            $discipline = Discipline::where('name', $disciplineName)->first();

            if (!$discipline) {
                continue;
            }

            foreach ($volleyballStatistics as $index => $slug) {

                $type = StatisticType::where('slug', $slug)->first();

                DisciplineStatistic::firstOrCreate([
                    'discipline_id' => $discipline->id,
                    'statistic_type_id' => $type->id,
                ], [
                    'order' => $index + 1,
                ]);
            }
        }
    } 
}