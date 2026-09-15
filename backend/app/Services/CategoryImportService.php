<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Championship;
use App\Models\ChampionshipDiscipline;
use App\Models\Discipline;
use Exception;

class CategoryImportService
{
    public function import(
        Championship $championship,
        array $headers
    ): array {

        $columnCategoryMap = [];

        // Trae todas las disciplinas y normaliza los nombres
        $disciplines = Discipline::all()->keyBy(function ($discipline) {
            return $this->normalizeText($discipline->name);
        });

        foreach ($headers as $column => $header) {

            $discipline = $disciplines->get(
                $this->normalizeText($header['discipline'])
            );

            if (!$discipline) {
                throw new Exception(
                    "La disciplina '{$header['discipline']}' no existe."
                );
            }

            /*
             * Crear ChampionshipDiscipline
             */

            $championshipDiscipline =
                ChampionshipDiscipline::firstOrCreate(

                    [
                        'championship_id' => $championship->id,
                        'discipline_id' => $discipline->id
                    ]

                );

            /*
             * Crear categoría
             */

            $category = Category::firstOrCreate(

                [
                    //'championship_id' => $championship->id,
                    //'discipline_id' => $discipline->id,
                    'championship_discipline_id' =>
                        $championshipDiscipline->id,

                    'name' =>
                        $header['category']
                ],

                [
                    'gender_type' =>
                        $header['gender'],

                    'format' => 'liga',

                    'format_settings' => [
                        'round_trip' => false
                    ]
                ]

            );

            /*
             * Guardar mapa
             */

            $columnCategoryMap[$column] = $category->id;
            $columnCategoryMap[$column] = [
                'category_id' => $category->id,
                'discipline_name' => $discipline->name,
                'discipline_id' => $discipline->id,
                'championship_discipline_id' => $championshipDiscipline->id,
                'category_name' => $header['category'],
            ];
        }

        return $columnCategoryMap;
    }

    private function normalizeText(string $text): string
    {
        $text = trim($text);
        $text = mb_strtolower($text, 'UTF-8');

        // Eliminar tildes
        $text = strtr($text, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'ü' => 'u',
            'ñ' => 'n',
        ]);

        return $text;
    }
}