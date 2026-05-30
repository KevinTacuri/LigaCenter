# LigaCenter - Frontend

Este es el proyecto independiente de Frontend para **LigaCenter** (Gestión de Campeonatos Deportivos). Está desarrollado como una SPA (Single Page Application) utilizando **React**, **TypeScript**, **Vite** y **Tailwind CSS v4**.

---

## 🛠️ Stack Tecnológico y Dependencias

El proyecto utiliza las siguientes herramientas y dependencias principales:

*   **Entorno de Ejecución y Empaquetado:** Vite
*   **Biblioteca Principal:** React 19 (con TypeScript)
*   **Gestor de Paquetes:** `pnpm` (recomendado v11.2.2 o superior)
*   **Enrutador:** `react-router-dom` v7 (para manejar la navegación interna)
*   **Cliente de API:** `axios` (para la comunicación con el backend Laravel)
*   **Estilos:** `tailwindcss` v4 (con integración nativa mediante el plugin de Vite `@tailwindcss/vite`)

---

## 📂 Estructura del Código

El código fuente del frontend se organiza de la siguiente manera dentro de la carpeta `src/`:

```text
src/
├── assets/             # Imágenes y recursos estáticos
├── contexto/           # ContextoAutenticacion.tsx (Manejo de sesión, roles y permisos)
├── paginas/            # Vistas principales de la aplicación:
│   ├── Login.tsx       # Pantalla de inicio de sesión con diseño oscuro y glassmorphism
│   ├── Registro.tsx    # Pantalla de creación de cuenta pública
│   └── Tablero.tsx     # Tablero principal de control con acceso condicional
├── servicios/          # api.ts (Instancia de Axios con interceptores y llamadas tipadas a la API)
├── App.tsx             # Configuración del Router y envoltura de Contexto
├── index.css           # Punto de entrada de CSS (importa Tailwind)
└── main.tsx            # Punto de entrada de la aplicación React
```

---

## 🚀 Guía de Instalación y Ejecución

Sigue estos pasos para arrancar el frontend en tu máquina local:

### 1. Requisitos Previos
*   Tener instalado **Node.js** (versión LTS recomendada, ej. v24+)
*   Tener instalado **pnpm** (se puede ejecutar mediante `pnpm.cmd` si tienes restricciones en PowerShell)

### 2. Instalar Dependencias
Desde la carpeta raíz del proyecto frontend (`proyecto-campeonato/frontend/`), ejecuta:
```bash
pnpm install
```

### 3. Levantar Servidor de Desarrollo
Para iniciar el proyecto localmente con recarga rápida (HMR), ejecuta:
```bash
pnpm dev
```
La aplicación estará disponible por defecto en:
👉 **[http://localhost:5173](http://localhost:5173)**

### 4. Compilación para Producción
Para generar los archivos listos para el despliegue final en la carpeta `/dist`, ejecuta:
```bash
pnpm build
```

---

## 🔗 Integración con el Backend
Las peticiones HTTP del frontend están configuradas para consultar la URL de la API local en `http://127.0.0.1:8000/api` por defecto. 

Si deseas cambiar la dirección de la API, puedes definir la variable de entorno `VITE_API_URL` en un archivo `.env` dentro de la carpeta `frontend/`:
```env
VITE_API_URL=https://tu-servidor-produccion.com/api
```
