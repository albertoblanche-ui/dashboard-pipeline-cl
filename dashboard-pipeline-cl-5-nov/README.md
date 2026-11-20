# Dashboard Pipeline Chile

Dashboard del pipeline de Chile en una sola vista (`/`). Lee Attio por API, solo lectura, cada 5 minutos. Sin dependencias.

Definición de vistas y decisiones: `01-definicion-vistas.md`. Reglas (meta, límites por etapa, must-win, equipo): `lib/config.js`.

## Correr en local
```
~/.local/node/bin/node dev.mjs
```
Abre http://localhost:3000. Necesita `.env.local` con `ATTIO_API_KEY=...`. Desde el 9-nov el dashboard no pide clave (`/api/data` ya no lee `DASHBOARD_PASSWORD`); `/jaime` conserva `JAIME_PASSWORD`.

## Vista única (rediseño del 20-nov-2026)
Todo vive en `/` (public/index.html). Panel, Torre de control, modo TV e Iniciativas se fusionaron; `/panel` redirige a `/` y `/tv` abre `/?auto=1`.
- Barra fija: filtros Owner (Tomi, Anto, Beto), Origen (TGP o equipo) y Sector (público = Client segment "Government"), que valen para todo. Botón ▶ Avanzar solo (30 s por diapositiva, apagado por defecto) y pantalla completa. Un solo modo de color: paleta Bosque (negro verdoso, verde neón y blanco; elegida el 21-nov). Todo filtro u opción que no está en su valor por defecto ("ver todo") se marca en ámbar, con "✕ Quitar filtros" y "↺ Ver todo" para volver.
- Escala proporcional (21-nov): se diseña para 1440×900 y en cualquier pantalla (TV 1080p o 4K) se agranda o achica entero, igual que una diapositiva (`BASE_W`/`BASE_H` en index.html). Bajo 1000 px de ancho manda el diseño de celular.
- 10 diapositivas, se pasan con ◀ ▶ o el teclado: Camino al millón (con "¿Alcanza lo avanzado?"), Actividad semanal, Carrera de deals (alto por tramos de ARR), Pipeline por etapa + Demand generation, Evolución del pipeline, Días por etapa, Pipeline por owner (sin Esteban), Calidad de TGP, Carrera de países y Mapa de Chile.
- En todos los gráficos: el dato al pasar el mouse y la lista de deals con doble clic.
- Pendientes del equipo: desplegable abajo (resumen, le toca, tareas, esperando al cliente, dónde presionar, higiene).
- Mapa navegable (21-nov): zoom con rueda o + −, arrastre, minimapa con el rectángulo de lo que se ve, saltos Chile/Norte/Centro/Santiago/Sur, regiones pintadas por ARR, deals, % TGP, % público o avanzados, y panel "En pantalla". Un punto por deal en la dirección real de la institución (`lib/ubicaciones.js`, investigada el 20-nov; la llave es el SHA-256 del nombre porque el repo es público). Una cuenta nueva sale "Sin ubicación" hasta agregarla.
- Celebración de contrato firmado: `/?celebrar=1` para probarla.
- Vista de Jaime Mañalich (`/jaime`, clave propia en `JAIME_PASSWORD`): sin cambios.
- Carrera de países: Chile parte el 17-ago-2026; Colombia y Brasil siguen provisorios (`PAISES` en `lib/config.js`).

## Archivos
- `lib/attio.js`: lectura de Attio (deals de Chile, historial de etapas, listas CL - Pipeline y TGP, tareas del equipo).
- `lib/dashboard.js`: cálculos (ARR, prioridad, alertas, higiene, candidatos a perdido, movimiento de la semana).
- `api/data.js`: endpoint `/api/data` (función de Vercel).
- `public/`: páginas.

## Respaldos mientras no existan los 4 campos nuevos en Attio
Los slugs esperados están en `lib/config.js` (`next_step_date`, `next_step_owner`, `ball_in`, `must_win`). Si se crean con otros slugs, cambiarlos ahí. Mientras tanto: la fecha del next step se lee del texto, la pelota se infiere del texto y los must-win se marcan por nombre.
