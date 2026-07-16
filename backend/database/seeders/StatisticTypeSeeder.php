<?php

namespace Database\Seeders;

use App\Models\StatisticType;
use Illuminate\Database\Seeder;

class StatisticTypeSeeder extends Seeder
{
    public function run(): void
    {
        $statistics = [
            [
                'name' => 'Goals',
                'slug' => 'goals',
                'display_name' => 'Goleadores',
            ],
            [
                'name' => 'Assists',
                'slug' => 'assists',
                'display_name' => 'Máximos Asistidores',
            ],
            [
                'name' => 'Yellow Cards',
                'slug' => 'yellow_cards',
                'display_name' => 'Tarjetas Amarillas',
            ],
            [
                'name' => 'Red Cards',
                'slug' => 'red_cards',
                'display_name' => 'Tarjetas Rojas',
            ],
            [
                'name' => 'Matches Played',
                'slug' => 'matches_played',
                'display_name' => 'Partidos Jugados',
            ],
            [
                'name' => 'Points',
                'slug' => 'points',
                'display_name' => 'Puntos',
            ],
            [
                'name' => 'Blocks',
                'slug' => 'blocks',
                'display_name' => 'Bloqueos',
            ],
            [
                'name' => 'Aces',
                'slug' => 'aces',
                'display_name' => 'Aces',
            ],
        ];

        foreach ($statistics as $statistic) {
            StatisticType::firstOrCreate(
                ['slug' => $statistic['slug']],
                $statistic
            );
        }
    }
}