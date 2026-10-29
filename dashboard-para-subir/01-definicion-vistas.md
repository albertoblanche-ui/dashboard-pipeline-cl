# Dashboard Pipeline Chile · Paso 1: qué va en cada vista

22-oct-2026 · Beto + Claude. Parte de la propuesta del 14-oct (`propuesta-dashboard-pipeline-cl.html`) y le suma lo que pidió Tomi el 19-oct: estadísticas del funnel, tiempo por etapa, evolución semanal y mensual, y cómo medir el rol de Beto.

Fuentes leídas: Granola "Tomás / Alberto Next Steps PipeLine" (9-oct), "Objetivos y KPIS Beto" (19-oct), "Revisión PipeLine Qualificatión y First Meeting Held" (8-oct), "Revisión Pipeline CRM" (13-oct); Attio en vivo (22-oct); `Contexto Claude/mapas/attio.md`.

---

## 0. Qué tiene que lograr (en palabras de Tomi)

| Fecha | Lo que dijo | Qué implica para el dashboard |
|---|---|---|
| 9-oct | "Lo más importante es tener alertas de accionables. Que no haya ningún deal que se nos esté atrasando." | La vista central es una cola de acciones, no un gráfico |
| 9-oct | Separar next steps "de ellos" (recordar seguimiento) y "de nosotros" (hacerlo el mismo día) | Campo "Pelota en" y dos colas distintas |
| 9-oct | ARR en grande, meta, % avance, vidas salvadas, que explote la pantalla al cerrar | Vista TV |
| 9-oct | Must-win: ACHS, UC Christus, San José + uno más | Panel "Camino al millón" |
| 19-oct | Objetivo del rol: **acortar el ciclo de venta y liberar al Revenue Manager**. "Lo que no se mide no se gestiona" | La vista de métricas mide ciclo y velocidad, y sirve para los 1:1 de OKR |
| 19-oct | Funnel completo y por fase, tiempo promedio en cada etapa, dónde se estancan, por valor y por fase | Vista Métricas |
| 19-oct | Deals que no avanzan pasan a perdido; se reviven si corresponde | Regla de higiene con propuesta automática de Closed lost |
| 19-oct | Ticket mínimo USD 50K | Corte de tamaño en todas las vistas |

**Prueba de éxito del dashboard** (para que no quede tirado): en 4 semanas, (1) la revisión del lunes se hace desde la pantalla y no desde Attio, (2) ≥ 90% de los deals abiertos tienen next step con fecha y responsable, (3) cada persona abre su cola al menos 3 días por semana.

---

## 1. El panel de expertos

Tres roles que van a opinar en cada decisión. Los cito por sus ideas, no los inventé como personas.

| Rol | Referentes | Qué aporta | Regla que nos impone |
|---|---|---|---|
| **Product Manager** | Marty Cagan (*Inspired*, *Empowered*), Teresa Torres (*Continuous Discovery Habits*), Clayton Christensen (Jobs to be Done) | Construir para un "trabajo" concreto del usuario y medir adopción, no entregar features | Cada vista tiene un usuario, un momento de uso y una decisión que cambia. Se lanza chico, se mira el uso y se itera semanal |
| **Dashboards y métricas** | Stephen Few (*Information Dashboard Design*), Edward Tufte, Cole Nussbaumer Knaflic (*Storytelling with Data*), Andy Grove (*High Output Management*), John Doerr (*Measure What Matters*) | Una pantalla legible de un vistazo; indicadores adelantados y métricas en pareja | Máximo 5 a 7 números por pantalla. Cada métrica de velocidad va pareada con una de calidad (Grove) para no premiar atajos |
| **Pipeline y seguimiento de deals** | Jacco van der Kooij (Winning by Design, *Revenue Architecture*), Mark Roberge (*The Sales Acceleration Formula*), Andy Whyte (MEDDICC), Aaron Ross (*Predictable Revenue*), Jason Lemkin (SaaStr) | Funnel como sistema de conversión y tiempo; criterios de salida por etapa; higiene | Se mide **conversión y días por etapa**, no actividad. Un deal sin próximo paso con fecha no es pipeline |

**Fórmula que guía todo (Sales Velocity, estándar de Winning by Design / SaaStr):**
`Velocidad (USD/día) = # deals abiertos × win rate × ticket promedio ÷ ciclo de venta en días`
Es la mejor métrica única para el rol de Beto: sube si se acorta el ciclo, si se convierte más o si entran deals más grandes.

---

## 2. Las cuatro vistas

### Vista 1 · TV de la oficina ("Sala de guerra")
**Usuario:** todo el equipo, de pasada. **Pregunta:** ¿vamos a llegar al millón y qué se está moviendo? Rota cada 30 segundos entre 3 pantallas; letra grande, se lee a 4 metros.

| Pantalla | Componentes |
|---|---|
| A · Meta | ARR firmado 2026 en grande vs USD 1MM, % avance, días al 31-dic, "ritmo necesario" (USD por semana que falta firmar); ARR en vivo; vidas salvadas (Critical Saving Alerts, pendiente con Brandon) |
| B · Camino al millón | Los 4 must-win en tarjetas: etapa, ARR, días en la etapa, próximo paso, responsable y semáforo. Debajo, el funnel por etapa en USD y en cantidad |
| C · Lo que nos toca | Next steps vencidos y de hoy, por persona, con foto o iniciales. Rojo = pelota nuestra vencida |
| Evento | Al pasar un deal a Contract signature o al registrar una vida salvada: pantalla completa con celebración por 60 segundos |

Lo que **no** va en la TV: tablas largas, métricas históricas, nada que necesite click.

### Vista 2 · Torre de control de Beto ("Dónde presionar hoy")
**Usuario:** Beto, cada mañana, y Tomi en la revisión del lunes. **Pregunta:** ¿cuáles son los 5 empujones que más plata mueven hoy?

1. **Cola de presión priorizada.** Un puntaje por deal:
   `Prioridad = ARR USD × probabilidad de la etapa × urgencia`
   donde urgencia sube si: el next step venció, la pelota es nuestra, los días en la etapa superan el límite de esa etapa, es must-win, o la fecha de firma es en 2026. Así un deal de USD 1MM atrasado sale antes que uno de USD 50K atrasado ("vale más mover un deal de un millón que uno de 50 mil").
2. **Dos columnas, regla de Tomi:**
   - *Nos toca* (pelota nuestra): se hace hoy. Vencidos en rojo.
   - *Esperando al cliente*: cuántos días lleva; a los 5 días hábiles se propone el seguimiento y el texto.
3. **Tareas por persona** (Tomi, Seba, Anto, Brandon, Beto): abiertas, vencidas, de esta semana, sacadas de las tareas de Attio y del responsable del next step.
4. **Higiene del pipeline** (lista de arreglos, cada uno con link al deal en Attio):
   sin next step · next step sin fecha o sin responsable · sin actividad > 14 días · fecha de firma pasada y deal abierto · ARR USD en 0 · Closed lost reason lleno en deal abierto · ticket bajo USD 50K.
5. **Candidatos a Closed lost:** deals con más del doble del límite de días de su etapa sin movimiento. El dashboard los propone; Tomi los aprueba (o los revive) en la revisión del lunes.
6. **Movimiento de la semana:** qué deals avanzaron, retrocedieron o se perdieron desde el lunes, con USD movido.

### Vista 3 · Métricas del funnel (evolución semanal y mensual)
**Usuario:** Tomi y Beto en el 1:1 de OKR y en la revisión mensual. **Pregunta:** ¿el pipeline se está moviendo más rápido y dónde se tranca?

| Métrica | Cómo se calcula | Cortes |
|---|---|---|
| **Días por etapa** (mediana y p75) | Desde que el deal entra a la etapa hasta que sale, con el historial de etapas de Attio | Por etapa · segmento · tamaño de ticket · fuente |
| **Conversión etapa a etapa** | % de deals que pasan a la siguiente etapa (y % que se pierden en cada una) | En cantidad y en USD |
| **Dónde nos estancamos** | Etapa con más días mediana y más USD detenido sobre el límite | Mapa de calor etapa × semana |
| **Ciclo de venta** | Días desde creación (o desde la primera reunión) hasta Contract signature | Mensual, por cohorte de creación |
| **Sales velocity** | Fórmula de la sección 1 | Semanal, con tendencia |
| **Pipeline creado** | USD y # de deals nuevos por semana | Por fuente: TGP, Seba, inbound, red |
| **Win rate** | Firmados ÷ (firmados + perdidos) | Por cantidad y por USD |
| **Pipeline ponderado vs meta** | Σ ARR × probabilidad, solo firma 2026 | Semanal: ¿alcanza para llegar? |

Tres puntos de partida para medir, como pidió Tomi: desde la **creación**, desde la **primera reunión** (`first_meeting_date`) y desde el **último cambio de etapa**. Se muestran los tres; la principal es desde la primera reunión, porque es cuando el equipo empieza a trabajar el deal.

**Tamaño de ticket** (para "por valor"): menos de USD 50K (bajo el mínimo) · 50K a 150K · 150K a 500K · más de 500K.

**Histórico y dinámico:** el historial de etapas de Attio permite reconstruir hacia atrás todo lo que pasó desde que se crearon los deals. Desde el día de lanzamiento, además, se guarda una foto diaria del pipeline, para ver el efecto de la gestión semana a semana. Se marca en los gráficos la fecha de inicio de cada iniciativa (por ejemplo, "higiene del pipeline, 20-oct") para ver si movió la aguja.

### Vista 4 · Mi rol (KPIs de Beto para los 1:1 de OKR)
**Usuario:** Beto y Tomi, semanal. **Objetivo del rol:** acortar el ciclo de venta y liberar al Revenue Manager.

| Key result propuesto | Métrica | Pareja de calidad (Grove) |
|---|---|---|
| Acortar el ciclo | Mediana de días desde primera reunión a firma, y días en Build consensus y Negotiation | Win rate no baja |
| Ningún deal atrasado | % de next steps "pelota nuestra" ejecutados el mismo día | % de deals que avanzan de etapa en 30 días |
| Pipeline limpio | % de deals abiertos con next step, fecha y responsable (meta ≥ 90%) | # de deals revividos después de pasar a perdido |
| Más plata en movimiento | USD que avanzó de etapa por semana | USD que retrocedió o se perdió |
| Liberar al Revenue Manager | Horas de Anto y Tomi en tareas de preparación (briefs, seguimientos, Attio) que hacen los agentes | Calidad: % de recomendaciones del agente aprobadas sin cambios |

Las iniciativas semanales (página de Notion pedida el 19-oct) se ligan a estos KR: cada iniciativa dice qué métrica espera mover.

---

## 3. Fuentes de datos

| Fuente | Qué aporta | Cuándo |
|---|---|---|
| **Attio** (núcleo) | Deals, etapa, historial de etapas, ARR, fechas, next step, last action, responsable, tareas, notas | Versión 1 |
| Attio (interacciones) | Último correo o reunión con la cuenta (`last_interaction`, `next_calendar_interaction`), que Attio ya sincroniza de Gmail y Calendar | Versión 1 |
| Granola | No directo: el Agente Attio (18:00) ya pasa las reuniones a Attio | Vía Attio |
| Gmail y Slack | Señales de que el cliente respondió o de que hicimos el paso; el agente las cruza con Attio y propone cambios | Versión 3 |
| MCP de Telepatía | Critical Saving Alerts para "vidas salvadas" | Versión 2 (pendiente con Brandon) |
| Slack (salida) | Mensaje diario a cada persona con su cola y aviso de cierres en el canal | Versión 1 |

Principio: **el dashboard solo lee y Attio es la única verdad**. Si algo está mal, se corrige en Attio.

---

## 4. Lo que encontré hoy en Attio (22-oct)

- 71 oportunidades de Chile: 23 Qualification · 15 First meeting held · 15 Build consensus · 5 Negotiation · 1 PoC preparation · 1 PoC execution · 1 Contract signature · 1 Ready for use · 9 Closed lost.
- El **Weighted amount sale en USD 0** incluso en deals que ya tienen ARR USD (Policenter: ARR USD 430K, Build consensus, ponderado 0). El dashboard tiene que calcular el ponderado por su cuenta.
- El historial de etapas **no se ve por el conector de Claude**; se lee por la API de Attio (valores históricos del campo de etapa). Hay que confirmarlo con la llave de API antes de prometer el histórico.
- **Confirmado el 26-oct con la llave de API:** Attio guarda el historial completo de etapas (fecha de entrada y salida y quién la cambió). Hay 77 deals de Chile con 112 cambios de etapa desde el 12-jun-2026. Mediana de días por etapa (incluye deals que siguen en ella): Qualification 9 · First meeting held 10 · Build consensus 23 · Negotiation 10 · PoC preparation 12 · Contract signature 19. Coinciden con los límites de la sección 5b.
- Los 4 campos propuestos el 14-oct (fecha del next step, responsable, pelota en, must-win) siguen siendo la condición para que la Vista 2 funcione.

---

## 5. Cómo se arma

- **App propia en Vercel + GitHub** (la opción C del 14-oct): Next.js, lee Attio por API cada 5 minutos con caché, recibe los avisos de Attio al cambiar una etapa (para la celebración) y guarda una foto diaria en una base pequeña (Postgres en Vercel o Supabase) para la evolución.
- **Acceso:** login con Google restringido a @telepatia.ai; la TV usa un link de solo lectura con token. Los datos del pipeline no deben quedar públicos.
- **Ruta `/tv`** en pantalla completa, para dejar el navegador de la tele abierto 24/7.
- Costo estimado: unos USD 20 al mes.
- Ojo: hoy el conector de GitHub de Claude falló al conectarse (error de autorización); para crear el repositorio hay que reconectarlo o usar `gh` en el terminal.

## 5b. Decisiones de Beto (22-oct)

1. Los 4 campos del 14-oct están aprobados por Tomi.
2. Ciclo de venta: la medida principal es desde la primera reunión; también se muestra desde la creación.
3. Límites más estrictos para marcar un deal como estancado (se ajustan con el histórico):

| Etapa | Estancado a los | Candidato a Closed lost a los |
|---|---|---|
| Qualification | 7 días | 21 días |
| First meeting held | 10 días | 30 días |
| Build consensus | 21 días | 45 días |
| Negotiation | 10 días | 30 días |
| PoC preparation | 10 días | 30 días |
| PoC execution | 30 días | 60 días |
| Contract signature → Ready for use | 30 días | — (alerta a Deployment) |

   Además: deal sin actividad por más de 7 días = alerta (antes eran 14). Pelota en el cliente por más de 3 días hábiles = seguimiento.
4. Un solo link para todos con login @telepatia.ai. La TV es el computador de Beto conectado a la tele con la página `/tv` abierta.
5. La llave de API de Attio la crea Beto (admin). Es necesaria: ver el chat del 22-oct.

## 6. Plan, paso a paso

1. **Hoy:** cerrar las vistas y las métricas (este documento).
2. **Datos:** llave de API de Attio de solo lectura; confirmar que se lee el historial de etapas; crear los 4 campos; fijar los límites de días por etapa.
3. **Versión 1 (1 semana):** Vista 2 (torre de control) + TV pantallas A y B + mensaje diario por Slack. Se estrena en la revisión del lunes.
4. **Versión 2:** Vista 3 (métricas) con el histórico reconstruido, Vista 4, celebración y vidas salvadas.
5. **Versión 3:** el agente lee correo, Slack y WhatsApp y propone next steps; el dashboard muestra qué falta aprobar.

**Ritual de uso** (sin esto se muere): 8:30 cada persona recibe su cola por Slack · lunes, 15 minutos de revisión desde la pantalla (meta → must-win → candidatos a perdido → cola por persona) · viernes llega solo el resumen de lo que se movió · 1:1 de OKR con la Vista 4.
