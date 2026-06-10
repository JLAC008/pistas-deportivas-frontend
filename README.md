# Pistas Deportivas - Frontend

Frontend de la aplicación de reservas de pistas deportivas desarrollada con Angular 21 y Tailwind CSS.

## Descripción

Aplicación web para la gestión y reserva de pistas deportivas. Permite a los usuarios buscar, reservar y gestionar reservas de pistas deportivas, con funcionalidades de autenticación y pasarela de pagos.

## Tecnologías

- **Framework:** Angular 21
- **Estilos:** Tailwind CSS 4
- **Lenguaje:** TypeScript 5.9
- **Gestión de estado:** RxJS 7
- **Linting:** ESLint con Angular ESLint

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/        # Componentes reutilizables
│   │   └── date-picker/   # Selector de fechas
│   ├── guards/            # Guards de autenticación
│   ├── interceptors/      # Interceptors HTTP
│   ├── models/            # Interfaces y modelos
│   ├── pages/             # Páginas principales
│   │   ├── admin/         # Panel de administración
│   │   ├── court-detail/  # Detalle de pista
│   │   ├── courts-list/   # Listado de pistas
│   │   ├── login/         # Inicio de sesión
│   │   └── payment-result/ # Resultado de pago
│   └── services/          # Servicios
│       ├── auth.service.ts
│       ├── court.service.ts
│       ├── payment.service.ts
│       └── reservation.service.ts
└── environments/          # Configuración de entornos
```

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Build de producción
npm run build
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo en http://localhost:4200 |
| `npm run build` | Build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige errores de linting |

## Variables de Entorno

Configurar en `src/environments/environment.ts` y `environment.prod.ts` según el entorno de despliegue.
