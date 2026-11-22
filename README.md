# Aplicación Web PWA (React + TypeScript) — Ecosistema de Comercio Digital GestoPago

Aplicación web progresiva (**PWA**) construida con **React 19, TypeScript, Vite 6 y Tailwind CSS v4**, conectada a la misma infraestructura de servicios REST en Spring Boot y GestoPago que la aplicación móvil Flutter.

## Repositorios del Ecosistema (Unidad II)

| Componente | Tecnología | Repositorio |
| :--- | :--- | :--- |
| **Backend API REST** | Spring Boot 3 + Java 17 + PostgreSQL + Redis | [AppHasaniGestoPagos](https://github.com/RonaldoChavez76/AppHasaniGestoPagos) |
| **Aplicación Móvil** | Flutter & Dart (`MOVIL`) | [gestopago-mobile-flutter](https://github.com/RonaldoChavez76/gestopago-mobile-flutter) |
| **Aplicación Web (PWA)** | React + TypeScript + Vite (`WEB`) | [gestopago-web-react](https://github.com/RonaldoChavez76/gestopago-web-react) |

## Módulos Implementados

1. **Autenticación, Doble Factor (2FA OTP) y Control de Sesión Única (`WEB` vs `MOVIL`):**
   - Inicio de sesión compartido (`POST /auth/login/2fa/solicitar` y `POST /auth/login/2fa/verificar`).
   - Detección automática de sesión simultánea (`409 Conflict`) con modal de confirmación para cerrar la sesión previa.
   - Verificación en foco de pestaña e intervalo periódico (`GET /auth/sesion`) para expulsar al cliente si fue reemplazado desde Móvil (`401 Unauthorized`).
   - Almacenamiento de sesión en `sessionStorage` y cierre seguro (`POST /auth/logout`).
2. **Catálogo Dinámico de Productos:**
   - Consulta en vivo (`GET /productos` y fallback `GET /api/gestopago/catalogo`), filtros por categoría y disponibilidad, buscador y modal de detalle.
3. **Módulo de Compras:**
   - Confirmación previa obligatoria, soporte de código OTP 2FA transaccional y diferenciación visual entre compra **Exitosa**, **Rechazada**, **Pendiente** y **Error de comunicación**.
4. **Historial de Compras Exitosas Sincronizado:**
   - Muestra únicamente operaciones confirmadas con estado `EXITOSA` (`GET /api/gestopago/transacciones/historial/exitosas`), con buscador, filtro por tipo y verificación en servidor por `UPC`.

## Arquitectura de Carpetas (`src/`)

```text
src/
├── components/   Modales de conflicto, confirmación, detalle y layout responsivo
├── config/       Configuración de entornos (Render Cloud / Localhost) y plataforma WEB
├── context/      SessionContext (sesión única, 2FA, sincronización automática)
├── core/         ApiClient HTTP centralizado y SessionStorageService
├── models/       DTOs tipados de autenticación, catálogo y transacciones
├── pages/        LoginPage, TwoFactorPage, AccountOverviewPage, CatalogPage, PurchasePage, HistoryPage
├── services/     AuthService, CatalogService, TransactionService
└── tests/        Pruebas unitarias, de componentes y escenario cruzado de Ana
```

## Requisitos y Ejecución

- Node.js `v22.x` o superior
- npm `11.x` o superior

```powershell
npm install
npm test
npm run build
npm run dev
```
