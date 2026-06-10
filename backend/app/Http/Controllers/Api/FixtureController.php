<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FixtureService;
use App\Services\SchedulingService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FixtureController extends Controller
{
    use ApiResponse;

    protected $fixtureService;
    protected $schedulingService;

    public function __construct(FixtureService $fixtureService, SchedulingService $schedulingService)
    {
        $this->fixtureService = $fixtureService;
        $this->schedulingService = $schedulingService;
    }

    public function generate(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'start_date' => 'required|date',
            'venue_ids' => 'required|array',
            'venue_ids.*' => 'exists:venues,id',
        ]);

        try {
            $matches = $this->fixtureService->generateRoundRobin(
                $request->discipline_id,
                $request->category_id,
                $request->start_date,
                $request->venue_ids
            );

            return $this->successResponse($matches, 'Fixture generado exitosamente', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function getFixture(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
        ]);

        $fixture = $this->fixtureService->getFixture(
            $request->discipline_id,
            $request->category_id
        );

        return $this->successResponse($fixture, 'Fixture obtenido exitosamente');
    }

    public function scheduleRound(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'round' => 'required|integer|min:1',
            'available_hours' => 'required|array',
            'available_hours.*' => 'string',
            'venue_ids' => 'required|array',
            'venue_ids.*' => 'exists:venues,id',
        ]);

        try {
            $scheduled = $this->schedulingService->scheduleMatchesForRound(
                $request->discipline_id,
                $request->category_id,
                $request->round,
                $request->available_hours,
                $request->venue_ids
            );

            return $this->successResponse($scheduled, 'Horarios asignados exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}