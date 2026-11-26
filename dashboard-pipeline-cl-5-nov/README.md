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
- Modo TV (21-nov): en la TV el dashboard se arma en un lienzo fijo de 1470×830 (el área del navegador en el MacBook de Beto) y se agranda entero, igual que en el computador. Se activa con `/tv` (o `?tv`), en navegadores de Google TV / Android TV y en pantallas que no son de computador; en el computador no se escala. `?pantalla` muestra tamaño, escala y versión. vercel.json pide no guardar versiones viejas (Cache-Control: no-cache).
- 11 diapositivas, se pasan con ◀ ▶ o el teclado: Camino al millón (con "¿Alcanza lo avanzado?"), Actividad semanal, Carrera de deals (alto por tramos de ARR), Pipeline por etapa + Demand generation, Evolución del pipeline, Días por etapa (parte sin casos extremos: estadías de 0 días y las sobre p75 + 1,5 × rango intercuartil), Pipeline por owner (sin Esteban), Calidad de TGP, Carrera de países, Mapa de Chile y Cohortes.
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
- Reglas de estado revisadas con Beto el 23-nov (detalle en `lib/config.js`): avanzó = subió de etapa en 14 días; margen de 3 días en amarillo para el next step vencido; deal nuevo sin next step en amarillo hasta 5 días; una espera justificada no salva un next step nuestro vencido (salvo el piloto en curso).
- Diapositiva 11, Cohortes (24-nov): triángulo por semana de creación (% que llegó a la etapa a cada edad; reunión desde la creación, el resto desde la primera reunión), curvas acumuladas y "¿Mejoramos?" (ventanas de 4 semanas con banda de confianza). Comparación con Colombia, Brasil, Argentina y México vía `/api/paises` (`lib/paises.js`): deals sin nombres desde abr-2026, mismo sector, n ≥ 30; tarda ~40 s la primera vez y la CDN lo guarda 6 horas.
- 24-nov (tarde), revisión de la diapositiva 11 con dos agentes: semanas por calendario (el cambio de hora corría los lunes a la semana anterior), fechas en hora de Chile, celdas siempre en % (k/n en el tooltip), avance estimado con Kaplan-Meier (no baja ni se infla), firma = pasó por Contract signature, tope de 13 semanas. Comparación con países lado a lado: "Hoy en paralelo" (mismas semanas desde el 17-ago) o "Desde el inicio de cada país" (desde su primera reunión registrada; Chile desde el lanzamiento), con curvas y entrada de deals acumulada.
- 24-nov (noche): cohortes todo en porcentaje ("% de deals" o "% del ARR", Kaplan-Meier ponderado por ARR). Comparación "Homologado desde su día 0": día 0 de cada país = el primer día que un deal tuvo primera reunión (Chile incluido: 17-jun-2026) y todos se comparan en los mismos días que lleva Chile; reemplaza "Primer año / Toda la historia".
- 26-nov, rediseño de la diapositiva 11 tras auditarla con 3 agentes (ventas, estadística y visualización): titular automático y 3 gráficos. (1) Velocidad: curvas Kaplan-Meier por semanas, por grupo o Chile contra los otros países con el mismo sector ("privado vs privado", "público vs público", "todo vs todo") y las mismas fechas (desde el 17-ago). (2) Cohortes por quincena de entrada: dónde está hoy cada deal (perdido → firmado) y % que llegó a la etapa en su plazo (Reunión 21 días, Build consensus 28, Negociación 42, PoC prep. 56, PoC ejec. 70, Firma 91). (3) Dónde y por qué se traban: estado de los abiertos por etapa y causas de los estancados. "Detalle por quincena" = triángulo. Firma = solo firmados hoy (un deal que pasó por Contract signature y volvió a PoC no firmó). Los perdidos cuentan como que no llegaron. Se sacaron el modo homologado (no hay país donde sirva; revisar en feb-2027), "¿Mejoramos?" y las filas por semana. Números verificados con un recálculo independiente.
