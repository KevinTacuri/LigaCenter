<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\Team;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class TeamImportService
{
    public function import(
        Championship $championship,
        Worksheet $sheet,
        array $categoryMap
    ): int {

        $created = 0;

        // fila 5 es el primer equipo
        $startRow = 5;

        $highestRow = $sheet->getHighestRow();

        foreach (range($startRow, $highestRow) as $row) {

            $cell = Coordinate::stringFromColumnIndex(1) . $row;
            $teamName = trim((string)$sheet->getCell($cell)->getValue());
            //$teamName = trim(
            //    (string)$sheet->getCellByColumnAndRow(1, $row)->getValue()
            //);

            if ($teamName === '') {
                continue;
            }

            foreach ($categoryMap as $column => $categoryData) {


                $cell = Coordinate::stringFromColumnIndex($column) . $row;
                //$value = trim((string) $sheet->getCell($cell)->getValue());

                if (!$this->hasRegistration($sheet->getCell($cell))) {
                    continue;
                }

                Team::create([

                    'name' => $teamName . ' - ' . $categoryData['discipline_name'] .' - ' . $categoryData['category_name'],

                    'championship_id' => $championship->id,

                    'category_id' => $categoryData['category_id'],

                    'registration_status' => 'Pendiente',

                    'representative' => null,

                    'logo' => null,

                    'description' => null

                ]);

                $created++;
            }
        }

        return $created;
    }

    private function hasRegistration($cell): bool
    {
        $value = trim((string) $cell->getValue());

        // Si hay cualquier texto => inscrito
        if ($value !== '') {
            return true;
        }

        $fill = $cell->getStyle()->getFill();

        // Si no hay patrón de relleno, está vacío
        if ($fill->getFillType() === \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_NONE) {
            return false;
        }

        // Si tiene cualquier tipo de relleno, lo consideramos marcado
        return true;
    }
}