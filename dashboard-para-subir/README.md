# Dashboard Pipeline Chile

Torre de control (`/`) y modo TV (`/tv`) del pipeline de Chile. Lee Attio por API, solo lectura, cada 5 minutos. Sin dependencias.

Definición de vistas y decisiones: `01-definicion-vistas.md`. Reglas (meta, límites por etapa, must-win, equipo): `lib/config.js`.

## Correr en local
```
~/.local/node/bin/node dev.mjs
```
Abre http://localhost:3000 (torre) y http://localhost:3000/tv (TV). Necesita `.env.local` con `ATTIO_API_KEY=...`. Opcional: `DASHBOARD_PASSWORD=...` pide clave para ver los datos.

## TV
- Rota 3 pantallas cada 30 s (meta, camino al millón, lo que le toca a cada uno). Flechas ← → para cambiar a mano.
- Cuando aparece un deal nuevo en Contract signature o Ready for use, celebra 60 s. Probar: `/tv?celebrar=1`.
- En Chrome: pantalla completa con Cmd+Ctrl+F.

## Archivos
- `lib/attio.js`: lectura de Attio (deals de Chile, historial de etapas, listas CL - Pipeline y TGP, tareas del equipo).
- `lib/dashboard.js`: cálculos (ARR, prioridad, alertas, higiene, candidatos a perdido, movimiento de la semana).
- `api/data.js`: endpoint `/api/data` (función de Vercel).
- `public/`: páginas.

## Respaldos mientras no existan los 4 campos nuevos en Attio
Los slugs esperados están en `lib/config.js` (`next_step_date`, `next_step_owner`, `ball_in`, `must_win`). Si se crean con otros slugs, cambiarlos ahí. Mientras tanto: la fecha del next step se lee del texto, la pelota se infiere del texto y los must-win se marcan por nombre.
