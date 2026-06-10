<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VenueRequest extends FormRequest
{
    public function authorize()
    {
        return auth()->check() && auth()->user()->hasRole('administrador');
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'venue_type' => 'required|string',
            'location' => 'required|string',
            'capacity' => 'nullable|integer',
            'is_available' => 'boolean',
        ];
    }
}