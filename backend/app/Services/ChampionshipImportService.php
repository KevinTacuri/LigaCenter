<?php

namespace App\Services;

use App\Models\Championship;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ChampionshipImportService
{
    public function __construct(
        private CategoryImportService $categoryImportService,
        private TeamImportService $teamImportService
    ) {}

    public function import(
        Championship $championship,
        UploadedFile $file
    )
    {
        return DB::transaction(function () use ($championship, $file) {

            $spreadsheet = IOFactory::load($file->getRealPath());

            $sheet = $spreadsheet->getActiveSheet();

            /*
             * Detectar disciplinas y categorías
             */

            //$categoryMap = $this->readCategoryHeaders($sheet);
            $headers = $this->readCategoryHeaders($sheet);

            $categoryMap = $this->categoryImportService->import(
                $championship,
                $headers
            );

            // Importar equipos
            $teamsCreated = $this->teamImportService->import(
                $championship,
                $sheet,
                $categoryMap
            );

            return [
                'message' => 'Importación completada correctamente.',
                'categories_created' => count($categoryMap),
                'teams_created' => $teamsCreated
            ];

            //return [
            //    'headers' => $categoryMap
            //];
        });
    }

    private function readCategoryHeaders(Worksheet $sheet): array
    {
        $headers = [];

        /*
        * En tu Excel:
        *
        * Fila 2 = disciplinas
        * Fila 3 = categorías
        */

        $disciplineRow = 2;
        $categoryRow = 3;

        $highestColumn = $sheet->getHighestColumn();

        $highestColumnIndex =
            Coordinate::columnIndexFromString(
                $highestColumn
            );

        $currentDiscipline = null;

        for ($column = 3; $column <= $highestColumnIndex; $column++) {

            $cell = Coordinate::stringFromColumnIndex($column) . $disciplineRow;
            $discipline = trim((string) $sheet->getCell($cell)->getValue());

            //$discipline = trim(
            //    (string)$sheet->getCellByColumnAndRow($column, $disciplineRow)->getValue()
            //);

            /*
            * Si la celda está combinada,
            * PhpSpreadsheet solo pone el valor
            * en la primera columna.
            *
            * Por eso recordamos
            * la última disciplina encontrada.
            */

            if (!empty($discipline)) {
                $currentDiscipline = $discipline;
            }

            //$category = trim((string) $sheet->getCell($cell)->getValue());

            //$category = trim(
            //    (string)$sheet->getCellByColumnAndRow($column, $categoryRow)->getValue()
            //);
            $cell = Coordinate::stringFromColumnIndex($column) . $categoryRow;
            $categoryName = trim((string) $sheet->getCell($cell)->getValue());

            $gender = 'Mixto';

            if (str_contains(strtoupper($categoryName), 'DAMAS')) {
                $gender = 'Femenino';
            }

            elseif (str_contains(strtoupper($categoryName), 'VARONES')) {
                $gender = 'Masculino';
            } 

            if (!$currentDiscipline || !$categoryName) {
                continue;
            }

            $headers[$column] = [
                'discipline' => $currentDiscipline,
                'category' => $categoryName,
                'gender' => $gender
            ];
        }

        return $headers;
    }
}