# Dashboard Pipeline Chile

Panel (`/panel`, con botón Modo TV) y Torre de control (`/`) del pipeline de Chile. `/tv` redirige a `/panel?tv=1`. Lee Attio por API, solo lectura, cada 5 minutos. Sin dependencias.

Definición de vistas y decisiones: `01-definicion-vistas.md`. Reglas (meta, límites por etapa, must-win, equipo): `lib/config.js`.

## Correr en local
```
~/.local/node/bin/node dev.mjs
```
Abre http://localhost:3000/panel (Panel), http://localhost:3000 (torre) y http://localhost:3000/panel?tv=1 (TV). Necesita `.env.local` con `ATTIO_API_KEY=...`. Opcional: `DASHBOARD_PASSWORD=...` pide clave para ver los datos.

## Panel y modo TV
- Panel: meta, esta semana vs la anterior, camino al millón, carrera de deals (kanban filtrable por owner, mes de firma y etapa; clic en un deal abre su detalle), pipeline por etapa, demand generation semanal, carrera de países y lo que le toca a cada uno.
- Modo TV (botón o `?tv=1`): fondo oscuro, rota carrera de deals, camino + semana, pipeline + demanda y lo de cada persona en páginas de 9. Flechas ← → cambian de pantalla, Esc vuelve al Panel.
- Cuando aparece un deal nuevo firmado, celebra 60 s. Probar: `/panel?tv=1&celebrar=1`.
- Carrera de países: el día 0 de cada país es provisorio (`PAISES` en `lib/config.js`).

## Archivos
- `lib/attio.js`: lectura de Attio (deals de Chile, historial de etapas, listas CL - Pipeline y TGP, tareas del equipo).
- `lib/dashboard.js`: cálculos (ARR, prioridad, alertas, higiene, candidatos a perdido, movimiento de la semana).
- `api/data.js`: endpoint `/api/data` (función de Vercel).
- `public/`: páginas.

## Respaldos mientras no existan los 4 campos nuevos en Attio
Los slugs esperados están en `lib/config.js` (`next_step_date`, `next_step_owner`, `ball_in`, `must_win`). Si se crean con otros slugs, cambiarlos ahí. Mientras tanto: la fecha del next step se lee del texto, la pelota se infiere del texto y los must-win se marcan por nombre.
