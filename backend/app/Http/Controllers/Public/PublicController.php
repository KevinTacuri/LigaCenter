<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class PublicController extends Controller
{
    use ApiResponse;
    
    public function __construct()
    {
        // Sin middleware de autenticación
    }
}