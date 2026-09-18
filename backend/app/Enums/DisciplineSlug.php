<?php

namespace App\Enums;

enum DisciplineSlug: string
{
    case CHESS = 'ajedrez';
    case HANDBALL = 'balonmano';
    case BASKETBALL = 'basquet';
    case BASKETBALL_3X3 = 'basquet-3x3';
    case FRONTON = 'fronton';
    case FULBITO = 'fulbito';
    case FOOTBALL_11 = 'futbol-11';
    case FOOTBALL_8 = 'futbol-8';
    case SWIMMING = 'natacion';
    case TABLE_TENNIS = 'tenis-de-mesa';
    case TIRO_AL_SAPO = 'tiro-al-sapo';
    case VOLLEYBALL = 'voley';
    case BEACH_VOLLEYBALL = 'voley-playa';
    case HOCKEY = 'hockey';
    case ATHLETICS = 'atletismo';
    case BEACH_HANDBALL = 'balonmano-playa';
}