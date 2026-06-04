# Pistas El Valle Perdido — Frontend

Aplicación web para el alquiler y reserva de pistas deportivas (tenis, fútbol, pádel, baloncesto, voleibol y frontón) en el Valle Perdido (Murcia). Incluye catálogo público, flujo de reserva con pago Redsys y panel de administración.

## Stack

- **Framework**: Angular `^21.1.0` (standalone components, signals)
- **Lenguaje**: TypeScript `^5.9.3` (target `ES2022`, `strict: true`, `strictTemplates`, `strictStandalone`)
- **Estilos**: TailwindCSS `^4.3.0` (vía `@tailwindcss/postcss`) + sistema de variables CSS propio (Terrain Design System)
- **Estado**: Angular Signals + `BehaviorSubject` expuestos como signal vía `toSignal` (sin NgRx ni librerías externas)
- **HTTP**: `HttpClient` con `withFetch()` e interceptor funcional (`authInterceptor`)
- **Formularios**: Template-driven (`FormsModule` + `ngModel`) + signals locales
- **Routing**: `@angular/router` con guard de clase (`AuthGuard` / `CanActivate`)
- **Linter**: ESLint `^10.4.0` con `@angular-eslint` y `typescript-eslint`
- **Tipografía**: Fraunces (display) + Plus Jakarta Sans (UI), cargadas desde Google Fonts

## Requisitos previos

- Node.js `>= 20` (el `Dockerfile` usa `node:20-alpine`)
- npm (el repositorio incluye `package-lock.json`)
- Backend de pistas deportivas accesible (por defecto `http://localhost:8080/api`)

## Instalación

```bash
npm install
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm start` | Arranca el dev server de Angular en `http://localhost:4200` |
| `npm run build` | Build de la aplicación con el builder `@angular/build:application` (salida en `dist/demo`) |
| `npm run lint` | Ejecuta ESLint sobre `src/**/*.ts` y `src/**/*.html` |
| `npm run lint:fix` | Igual que `lint` con auto-arreglo |
| `npm run ng -- <args>` | Acceso directo al CLI de Angular |

Configuraciones declaradas en `angular.json`: `development` (sin optimización, con source maps) y `production` (optimización + hashing de salida).

## Estructura del proyecto

```
src/
├── app/
│   ├── components/         # Componentes reutilizables
│   │   └── date-picker/    # Selector de fecha personalizado
│   ├── pages/              # Vistas principales (una por ruta)
│   │   ├── courts-list/    # Listado público de pistas
│   │   ├── court-detail/   # Detalle + reserva + pago
│   │   ├── login/          # Login del admin
│   │   ├── admin/          # Panel de administración
│   │   └── payment-result/ # Callback de Redsys
│   ├── services/           # AuthService, CourtService, ReservationService, PaymentService
│   ├── guards/             # AuthGuard
│   ├── interceptors/       # authInterceptor (inyecta JWT)
│   ├── models/             # api.model.ts, court.model.ts
│   ├── app.component.{ts,html,css}
│   ├── app.config.ts       # Bootstrap providers
│   └── app.routes.ts
├── environments/           # environment.ts, environment.prod.ts
├── resources/              # favicons, logos, iconos estáticos
├── global_styles.css       # Tailwind 4 + tokens del Terrain Design System
├── index.html
└── main.ts
docker/                     # Dockerfile + docker-compose.yml
```

## Rutas

Definidas en `src/app/app.routes.ts`:

| Path | Componente | Guard | Descripción |
|------|-----------|-------|-------------|
| `/` | `CourtsListComponent` | — | Listado público de pistas con filtros por tipo |
| `/pista/:id` | `CourtDetailComponent` | — | Detalle de pista, selección de slots y reserva |
| `/login` | `LoginComponent` | — | Login del administrador |
| `/admin` | `AdminComponent` | `AuthGuard` | Panel de administración |
| `/payment/result` | `PaymentResultComponent` | — | Callback de retorno de Redsys |
| `**` | — | — | Redirige a `/` |

## Páginas principales

- **Listado de pistas** (`/`): muestra todas las pistas activas con filtros por tipo (TENIS, FUTBOL, PADEL, BALONCESTO, VOLEIBOL, FRONTON). Datos cargados con `CourtService.loadAll()`.
- **Detalle de pista** (`/pista/:id`): selector de fecha (`DatePickerComponent`), grid de slots disponibles, formulario de cliente (nombre, email, teléfono) y selector de método de pago (`ONLINE`, `BIZUM`, `ONSITE`). Si el pago es `ONLINE`, llama a `PaymentService.initiate()` y redirige a la pasarela de Redsys.
- **Login** (`/login`): formulario usuario/contraseña. Tras un login correcto navega a `returnUrl` (query param) o a `/admin`.
- **Admin** (`/admin`): panel con pestañas (`schedule`, `courts`, `reservations`, `stats`) para gestionar pistas (CRUD + activar/desactivar + subida de imagen) y reservas (listado, filtros, cambio de estado y de estado de pago).
- **Resultado de pago** (`/payment/result`): recibe `Ds_MerchantParameters` y `Ds_Signature` por query string, los envía a `PaymentService.confirm()` y muestra el resultado.

## Servicios principales

Todos viven bajo `src/app/services/` y son `providedIn: 'root'`.

| Servicio | Endpoints / responsabilidad |
|----------|-----------------------------|
| `AuthService` | `POST /auth/login`; persiste el JWT en `localStorage` (`sportreserve_token`); expone `isLoggedIn` como signal |
| `CourtService` | `GET /courts`, `GET /courts/:id`, `GET /courts/:id/availability?date=`, `GET/POST/PUT/DELETE/PATCH /admin/courts/*`, `POST /admin/upload` |
| `ReservationService` | `GET/POST /reservations`, `GET /reservations/:id`, `PUT /reservations/:id/cancel`, `PUT /reservations/:id/status`, `PATCH /reservations/:id/payment-status` |
| `PaymentService` | `POST /payments/initiate`, `POST /payments/confirm`, `GET /payments/by-reservation/:id`, `GET /payments/:id` (integración con Redsys) |

### Interceptors

- **`authInterceptor`** (`src/app/interceptors/auth.interceptor.ts`): añade la cabecera `Authorization: Bearer <token>` a toda petición cuya URL comience por `environment.apiUrl`.

### Guards

- **`AuthGuard`** (`src/app/guards/auth.guard.ts`): si no hay sesión, devuelve un `UrlTree` hacia `/login`.

## Autenticación

- El login envía `{ username, password }` a `POST /auth/login`. La respuesta (`LoginResponse`) contiene `token`, `username` y `role`.
- El JWT se guarda en `localStorage` bajo la clave `sportreserve_token`.
- El estado de sesión es un `BehaviorSubject<boolean>` expuesto como signal (`isLoggedIn`) para que la UI reaccione (avatar/dropdown, guard).
- `authInterceptor` adjunta el token automáticamente; `AuthGuard` protege `/admin`; `logout()` elimina la clave de `localStorage`.

## Estilos

- `global_styles.css` importa Tailwind 4 (`@import "tailwindcss";`) y define el **Terrain Design System** mediante variables CSS en `:root`:
  - Paleta: `--forest`, `--forest-mid`, `--leaf`, `--sage`, `--sand`, `--cream`, `--parchment`, `--ink`…
  - Alias semánticos: `--primary`, `--primary-dark`, `--accent`, `--success`, `--warning`, `--danger`
  - Escala de grises (`--gray-50` … `--gray-900`)
  - Tokens de superficie, sombra (`--shadow-sm/md/lg`) y radio (`--radius-sm/lg/xl`)
- Define utilidades globales: `.btn` (+ `btn-primary/outline/ghost/success/warning/danger/sm/lg/block`), `.input`, `.select`, `.textarea`, `.status-badge`, `.form-error-inline`, animaciones (`fadeUp`, `pulse`, `dropdownIn`) y *responsive helpers* (`.desktop-only` / `.mobile-only`).
- Tipografía: **Fraunces** (display) + **Plus Jakarta Sans** (UI), precargadas en `index.html` desde Google Fonts.

## Build / Despliegue

### Build local

```bash
npm run build
```

Salida en `dist/demo/browser` (configuración `production` por defecto si se pasa `--configuration production`).

### Docker

El directorio `docker/` contiene un build multi-stage que:

1. Instala dependencias con `npm ci`.
2. **Reescribe** `src/environments/environment.ts` con el `API_URL` recibido como `ARG` del build:
   ```dockerfile
   ARG API_URL
   RUN printf "export const environment = {\n  production: true,\n  apiUrl: '%s'\n};\n" "$API_URL" > src/environments/environment.ts
   ```
3. Compila con `npm run build -- --configuration production`.
4. Sirve `dist/demo/browser` con `http-server` en el puerto **8081**.

Levantar con `docker compose` (toma `API_URL` del entorno o del `.env`):

```bash
docker compose -f docker/docker-compose.yml up --build
```

El compose se une a la red externa `dokploy-network` (despliegue orientado a [Dokploy](https://dokploy.com/)).

## Tests

No hay tests configurados en este momento: el proyecto no contiene archivos `*.spec.ts`, ni `karma.conf`, ni script `test` en `package.json`.

## Licencia

No se incluye fichero `LICENSE` en el repositorio.
