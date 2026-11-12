# Dashboard Pipeline Chile: lo que necesita saber el Agente Attio

Versión del 29-oct-2026 (v2: Panel nuevo y reglas de estancado revisadas). **El dashboard va a cambiar.** Si algo de aquí no calza con lo que ves, manda la fuente de verdad: el código en GitHub `albertoblanche-ui/dashboard-pipeline-cl` (carpeta `dashboard-para-subir`), sobre todo `lib/config.js` (reglas) y `lib/dashboard.js` (cálculos). La copia local está en `~/Documents/Telepatia/dashboard-pipeline-cl`. Si lo ves desactualizado, avísale a Beto en vez de suponer.

## Qué es
- Panel (vista macro, la misma que va en la TV con el botón Modo TV): https://dashboard-pipeline-cl.vercel.app/panel
- Torre de control (para operar): https://dashboard-pipeline-cl.vercel.app · el link antiguo /tv abre el Panel en modo TV.
- Lee Attio por API, **solo lectura**, cada 5 minutos. No escribe nada en Attio.
- **Todo lo que muestra sale de Attio.** Si el agente deja un campo mal o vacío, el dashboard lo muestra mal o lo marca como alerta. La calidad del dashboard depende de lo que escribe el agente.

## Qué deals lee
- Objeto `opportunities` con `opportunity_country` = Chile (no la lista CL - Pipeline).
- Historial de etapas de cada deal (`deal_stage` con valores históricos): de ahí salen los días en la etapa y el "movimiento de la semana".
- Lista CL - Pipeline (`247224c9-54d6-4bf6-a60a-dc1f162cbab7`): solo el campo `owner_of_next_step`.
- Lista CL - Agendadas por TGP (`28f819fd-0249-404d-b52e-3365ba7bd212`): marca TGP.
- Tareas abiertas en Attio de Tomi, Seba, Anto y Beto.

## Campos que usa y cómo debe dejarlos el agente
| Campo (slug) | Para qué lo usa | Cómo dejarlo |
|---|---|---|
| `next_step` | Cola "Dónde presionar hoy" y lo de cada persona | **Siempre con fecha escrita al inicio**, formato `27-oct` o `lun 27-oct`. Si hay varios pasos, el más próximo primero. Sin fecha = alerta "Next step sin fecha" |
| `next_step` (pelota) | Separa "Nos toca" de "Esperando al cliente" | Si el paso depende del cliente, que la primera frase lo diga: "Esperar respuesta de…", "Esperando que…". Si no, se asume que nos toca a nosotros |
| `owner_of_next_step` (lista CL - Pipeline) | Responsable del paso | Llenarlo. Si está vacío se usa el `deal_owner` |
| `last_update`, `last_action` | Días sin actividad | Actualizar al registrar una reunión. Más de 7 días sin actividad = alerta |
| `deal_stage` | Funnel, probabilidad, días en la etapa | Desde la v3 del manual (26-oct) el agente la cambia solo, sin OK: máximo una etapa por corrida, solo con evidencia, y nunca a Closed lost ni Ready for use. Cada cambio queda en el historial y cuenta para las métricas |
| `arr_usd` / `arr_local_currency` | Montos y prioridad | Si `arr_usd` está en 0, el dashboard lo estima desde CLP a 930 y lo marca con ≈ y como alerta |
| `expected_close_date` | Firma en 2026 sube la prioridad; fecha pasada = alerta | El agente la cambia solo con evidencia nueva (manual, sección 0.3). Nunca en el pasado |
| `first_meeting_date` | Ciclo de venta (desde la primera reunión) | Llenarlo en la primera reunión |
| `closed_lost_reason` | Si está lleno en un deal abierto = alerta | No llenarlo en deals abiertos |

## Campos nuevos aprobados (aún no existen en Attio al 26-oct)
Cuando se creen, el dashboard los usa en vez de leer el texto. Slugs esperados (si se crean con otro nombre, hay que cambiar `lib/config.js`):
- `next_step_date` (fecha del next step)
- `next_step_owner` (responsable del next step)
- `ball_in` (select: Nosotros / Cliente)
- `must_win` (checkbox)

Mientras no existan, el agente debe seguir escribiendo la fecha y "Esperar respuesta de…" dentro del texto del `next_step`, como se explica arriba.

## Reglas de alerta (valores al 29-oct; ver `lib/config.js`)
- Límite de días por etapa: Qualification 7 · First meeting held 10 · Build consensus 21 · Negotiation 10 · PoC preparation 10 · PoC execution 30 · Contract signature 30.
- **Lento** (amarillo): pasó el límite de días de su etapa, pero tuvo actividad en los últimos 7 días.
- **Estancado** (rojo): pasó el límite y lleva más de 7 días sin actividad.
- **Candidato a Closed lost**: pasó el límite de perdido (21 · 30 · 45 · 30 · 30 · 60) y lleva más de 14 días sin actividad. Lo decide Tomi en la revisión del lunes, no el agente.
- Ojo: los días en la etapa vuelven a cero cada vez que cambia la etapa, aunque sea un retroceso.
- Otras alertas: sin next step, next step vencido, sin responsable, fecha de firma pasada, ticket bajo USD 50K, ARR USD en 0.
- Must-win (mientras no exista el campo): por ahora solo ACHS (Beto, 29-oct). Los demás se irán definiendo.
- Orden de "Dónde presionar": todos los deals abiertos, primero la etapa más avanzada y dentro de cada etapa el ARR más grande. Las alertas son etiquetas, no cambian el orden.
- `contract_signature_date`: el Panel lo usa para la curva "Camino al millón" y la "Carrera de países". Llenarlo al firmar.
- Fechas del next step: se leen formatos como `27-oct`, `lun 27-oct`, `27/10` y `27 de octubre`.

## Qué le sirve al agente de todo esto
1. Al terminar de actualizar un deal, revisar que quede: next step con fecha al inicio, responsable, y la frase de pelota si espera al cliente.
2. Si ve un deal que el dashboard marcaría como estancado o candidato a perdido, mencionárselo a Beto en el resumen, sin cambiar la etapa.
3. No crear campos. Etapas, montos y fechas de firma: solo con evidencia, según la sección 0.3 del manual del Agente Attio, sin pedir OK. **Desde la v4 (28-oct): next step, `owner_of_next_step` y las tareas de Attio por persona se proponen (🔴/🟡/⚪) y Beto los aprueba antes de escribirlos (manual, sección 0.8).**
