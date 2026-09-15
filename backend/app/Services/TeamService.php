<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class TeamService
{
    // Resolve the logo from the request, either as a file upload or a URL
    public function resolveLogo(Request $request): ?string
    {
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');

            // Validar el archivo
            $request->validate([
                'logo' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);

            // Verificar que el archivo es válido (no falló en la subida)
            if (!$file->isValid()) {
                Log::error('Logo upload error', [
                    'error' => $file->getErrorMessage(),
                    'error_code' => $file->getError(),
                ]);
                return null;
            }

            // Asegurar que el directorio existe
            $disk = Storage::disk('public');
            if (!$disk->exists('teams/logos')) {
                $disk->makeDirectory('teams/logos');
            }

            // Generar nombre único y guardar
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'teams/logos/' . Str::uuid() . '.' . $extension;

            $stored = $disk->put($filename, file_get_contents($file->getRealPath()));

            if (!$stored) {
                Log::error('Logo could not be stored', [
                    'filename' => $filename,
                    'disk_root' => $disk->path(''),
                ]);
                return null;
            }

            Log::info('Logo stored', ['path' => $filename]);
            return $filename;
        }

        if ($request->filled('logo')) {
            $logoValue = $request->input('logo');
            // Solo aceptar si es URL válida
            if (filter_var($logoValue, FILTER_VALIDATE_URL)) {
                return $logoValue;
            }
            return null;
        }

        return null;
    }
}