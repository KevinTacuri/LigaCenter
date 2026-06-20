<?php

namespace Database\Seeders;

use App\Models\Discipline;
use Illuminate\Database\Seeder;

class DisciplineSeeder extends Seeder
{
    public function run(): void
    {
        $disciplines = [
            'Ajedrez',
            'Balonmano',
            'Básquet',
            'Básquet 3x3',
            'Frontón',
            'Fulbito',
            'Fútbol 11',
            'Fútbol 8',
            'Natación',
            'Tenis de Mesa',
            'Tiro al Sapo',
            'Vóley',
            'Vóley Playa',
            'Hockey',
            'Atletismo',
            'Balonmano Playa',
        ];

        foreach ($disciplines as $discipline) {
            Discipline::firstOrCreate([
                'name' => $discipline
            ]);
        }
    }
}