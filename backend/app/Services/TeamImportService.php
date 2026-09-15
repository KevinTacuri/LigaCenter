<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\Team;
use App\Models\ChampionshipTeam;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class TeamImportService
{
    public function import(
        Championship $championship,
        Worksheet $sheet,
        array $categoryMap,
        ?int $userId = null
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

                $team = Team::create([
                    'name' => $teamName,
                    'logo' => null,
                    'description' => null,
                    'discipline_id' => $categoryData['discipline_id'],
                    'user_id' => $userId,
                ]);

                ChampionshipTeam::create([
                    'championship_discipline_id' => $categoryData['championship_discipline_id'],
                    'team_id' => $team->id,
                    'category_id' => $categoryData['category_id'],
                    'representative' => null,
                    'registration_status' => 'Pendiente',
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