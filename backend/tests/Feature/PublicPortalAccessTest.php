<?php

namespace Tests\Feature;

use AppModelsCategory;
use AppModelsChampionship;
use AppModelsChampionshipDiscipline;
use AppModelsDiscipline;
use AppModelsPlayer;
use AppModelsTeam;
use AppModelsUser;
use IlluminateFoundationTestingRefreshDatabase;
use TestsTestCase;

class PublicPortalAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_championship_listing_never_returns_private_championships(): void
    {
        $owner = User::factory()->create();
        Championship::create(['user_id' => $owner->id, 'name' => 'Liga pública', 'is_public' => true]);
        Championship::create(['user_id' => $owner->id, 'name' => 'Liga privada', 'is_public' => false]);

        $this->getJson('/api/public/championships')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Liga pública'])
            ->assertJsonMissing(['name' => 'Liga privada']);
    }

    public function test_private_team_cannot_be_read_through_public_endpoint(): void
    {
        [$publicTeam, $privateTeam] = $this->createPublicAndPrivateTeams();

        $this->getJson('/api/public/teams/' . $publicTeam->id)
            ->assertOk()
            ->assertJsonFragment(['name' => 'Equipo público'])
            ->assertJsonMissing(['representative' => 'Contacto público']);

        $this->getJson('/api/public/teams/' . $privateTeam->id)->assertNotFound();
    }

    public function test_public_players_exclude_private_players_and_personal_documents(): void
    {
        [$publicTeam, $privateTeam] = $this->createPublicAndPrivateTeams();

        $publicPlayer = Player::create([
            'document_number' => '11111111',
            'names' => 'Jugador',
            'last_names' => 'Público',
            'birth_date' => '2000-01-01',
        ]);
        $privatePlayer = Player::create([
            'document_number' => '22222222',
            'names' => 'Jugador',
            'last_names' => 'Privado',
            'birth_date' => '2001-01-01',
        ]);
        $publicTeam->players()->attach($publicPlayer->id);
        $privateTeam->players()->attach($privatePlayer->id);

        $this->getJson('/api/public/players')
            ->assertOk()
            ->assertJsonFragment(['last_names' => 'Público'])
            ->assertJsonMissing(['last_names' => 'Privado'])
            ->assertJsonMissing(['document_number' => '11111111'])
            ->assertJsonMissing(['dni' => '11111111'])
            ->assertJsonMissing(['birth_date' => '2000-01-01']);
    }

    public function test_public_search_does_not_search_or_expose_document_numbers(): void
    {
        [$publicTeam] = $this->createPublicAndPrivateTeams();
        $player = Player::create([
            'document_number' => '87654321',
            'names' => 'Ana',
            'last_names' => 'Pública',
        ]);
        $publicTeam->players()->attach($player->id);

        $this->getJson('/api/public/search?q=87654321&type=players')
            ->assertOk()
            ->assertJsonMissing(['names' => 'Ana']);

        $this->getJson('/api/public/search?q=Ana&type=players')
            ->assertOk()
            ->assertJsonFragment(['names' => 'Ana'])
            ->assertJsonMissing(['document_number' => '87654321']);
    }

    public function test_public_statistics_routes_are_registered(): void
    {
        $this->getJson('/api/public/statistics/top-yellow-cards')->assertOk();
        $this->getJson('/api/public/statistics/top-red-cards')->assertOk();
    }

    private function createPublicAndPrivateTeams(): array
    {
        $owner = User::factory()->create();
        $discipline = Discipline::create(['name' => 'Fútbol']);
        $publicChampionship = Championship::create(['user_id' => $owner->id, 'name' => 'Público', 'is_public' => true]);
        $privateChampionship = Championship::create(['user_id' => $owner->id, 'name' => 'Privado', 'is_public' => false]);
        $publicLink = ChampionshipDiscipline::create(['championship_id' => $publicChampionship->id, 'discipline_id' => $discipline->id]);
        $privateLink = ChampionshipDiscipline::create(['championship_id' => $privateChampionship->id, 'discipline_id' => $discipline->id]);
        $publicCategory = Category::create(['championship_discipline_id' => $publicLink->id, 'name' => 'Pública']);
        $privateCategory = Category::create(['championship_discipline_id' => $privateLink->id, 'name' => 'Privada']);

        return [
            Team::create([
                'championship_id' => $publicChampionship->id,
                'category_id' => $publicCategory->id,
                'name' => 'Equipo público',
                'representative' => 'Contacto público',
            ]),
            Team::create([
                'championship_id' => $privateChampionship->id,
                'category_id' => $privateCategory->id,
                'name' => 'Equipo privado',
                'representative' => 'Contacto privado',
            ]),
        ];
    }
}
