# Plan maestro — Módulo Scraper de Becas (Becas Colombia)

> Este documento es para ti, agente ejecutor (Antigravity, opencode + GLM/DeepSeek/Gemini, o cualquier otro).
> Fue escrito por Claude Web actuando como planeador del proyecto, a partir de un análisis directo del código real subido por el humano responsable del proyecto.
> **Tu rol es ejecutar este plan. No lo rediseñes por tu cuenta.** Si algo aquí no calza con lo que encuentras en el repo, detente y repórtalo (ver sección 9) en vez de improvisar una solución.
>
> Este documento es específico del módulo `/scraper`. Los archivos `GUIA_MAESTRA_IA.md` y `ESTADO_PROYECTO_template.md` entregados antes siguen aplicando como reglas generales de comportamiento entre agentes (niveles de error, protocolo de continuidad entre sesiones/modelos). Este plan es la capa específica de "qué construir aquí, en este repo real". Ante cualquier contradicción entre ambos, **este documento manda**, porque está basado en el código real y no en un diseño conceptual previo.

---

## 0. Contexto: qué es "Becas Colombia" y cómo funciona hoy

Es un monorepo con tres piezas ya construidas en distintos grados de avance. Léelo completo antes de escribir una sola línea — parte del trabajo ya existe y no se repite.

### `/backend` — NestJS + Prisma + PostgreSQL + Redis (la pieza más madura)
- Base de datos con modelos: `University`, `Scholarship`, `Program`, `Requirement`, `Department` (con código DANE), `Source`, `Entity`, `AdmissionProcess`, `AdminUser`.
- Ya tiene autenticación JWT, un panel admin, y un endpoint clave para este plan: **`POST /ingest`**, protegido con header `x-api-key` (`SCRAPER_API_KEY`), que recibe un `IngestScholarshipDto` y guarda la beca con `needsReview=true`.
- También expone **`GET /universities`**, que devuelve la lista de universidades ya cargadas (id, nombre, ciudad, sitio web, ranking, etc.), con filtros y paginación.
- Ya existen **207 universidades colombianas reales** definidas en `backend/prisma/import-universities.ts`, con nombre, ciudad, departamento, tipo (pública/privada), ranking y sitio web.
- **Verificación obligatoria antes de empezar (tu primer paso real, no asumido):** confirma si esas 207 universidades ya están cargadas en la base de datos corriendo (`GET /universities` debería devolverlas) o si el script todavía no se ha ejecutado. Documenta cuál de los dos casos encontraste. No asumas ninguno de los dos.

### `/frontend` — Next.js 16, sitio público + panel admin
- Público: `/becas`, `/universidades`, `/admisiones`, y una sección `/internacionales` que **está fuera de alcance de este plan** (ver sección 2).
- Admin: login, cola de revisión (`/admin/revision`), gestión de universidades y becas.
- Las becas que entran por `/ingest` con `needsReview=true` aparecen en esa cola de revisión para que el humano las apruebe manualmente antes de que salgan al sitio público.

### `/scraper` — Python, Scrapy + Playwright (la pieza que vas a construir)
- Hoy solo existe: el contrato de datos (`becas_scraper/schemas.py`, clase `ScholarshipItem`), un `pyproject.toml` con dependencias base, y una carpeta `spiders/` **vacía**.
- El flujo previsto (documentado en `scraper/CLAUDE.md`, no lo cambies): spider extrae → normaliza a `ScholarshipItem` → pipeline valida con Pydantic → `POST` a `/ingest` con `x-api-key`.
- Reglas ya escritas ahí que debes respetar: `ROBOTSTXT_OBEY=True`, preferir fuentes gubernamentales oficiales (datos.gov.co, SNIES) sobre scraping cuando exista alternativa, páginas con JS usan `scrapy-playwright`, rate limiting activo (`AUTOTHROTTLE`).

### Flujo de datos completo, de punta a punta
```
Universidades (ya en la BD, 207)
        │
        ▼
  [TU TRABAJO: /scraper]
  descubre página de becas → rastrea → extrae con LLM → valida
        │
        ▼
   POST /ingest (x-api-key)         ← endpoint ya existe, no lo toques
        │
        ▼
  Beca guardada con needsReview=true
        │
        ▼
  Cola de revisión en /admin/revision   ← el humano aprueba manualmente
        │
        ▼
  Visible en el sitio público /becas
```

---

## 1. Quién hace qué en este proyecto

- **Claude Web (chat):** planeador. Diseña, documenta, responde dudas de arquitectura. No ejecuta ni edita código.
- **Tú (agente ejecutor — Antigravity, opencode + el modelo que esté disponible ese día):** implementas, corres, pruebas, iteras. Sigues este plan.
- **El humano:** aprueba decisiones de alcance y gasto, revisa las becas en el panel admin, decide cuándo avanzar de una etapa a otra.

---

## 2. Alcance de este plan (y lo que queda explícitamente afuera)

**Sí incluye:**
- Construir spiders/pipeline en `/scraper` para descubrir y extraer becas de universidades **colombianas** (las 207 ya cargadas).
- Un cliente de LLM para extracción estructurada, agnóstico de proveedor (Gemini, GLM, DeepSeek — el humano rota entre varios).
- Un checkpoint local para no reprocesar universidades ya hechas.

**No incluye, bajo ninguna circunstancia, sin aprobación explícita del humano:**
- La sección `/internacionales` del frontend y el tipo `ScholarshipType.INTERNACIONAL` del schema — se quedan como están, dormidos. No los actives ni los "completes por iniciativa propia".
- Cualquier cambio a `/backend` (schema de Prisma, controllers, servicios, el contrato de `/ingest`) — el scraper se adapta al backend existente, no al revés.
- Cualquier cambio a `/frontend`.
- Los archivos `CLAUDE.md` existentes en cualquier carpeta del proyecto — **no los edites**, aunque veas que documentan un estado desactualizado. Repórtalo en tu resumen de sesión, no lo "arregles" tú.
- Las 207 universidades ya definidas — no las borres, no las regeneres, no las dupliques con otra fuente.

---

## 3. Arquitectura del módulo scraper — lo que sí vas a construir

### Fase A — Origen de universidades
El spider **no** trae su propia lista de universidades. Al arrancar, llama a `GET {BACKEND_URL}/universities` (paginado, pedir todas) para obtener id, nombre, ciudad y sitio web. Una sola fuente de verdad: la base de datos, no un CSV duplicado dentro del scraper.

### Fase B — Descubrimiento de la página de becas
Para cada universidad, navega su `website` con Playwright y busca enlaces cuyo texto o URL contenga variantes de "becas", "financiación", "bienestar universitario", "apoyos económicos". **No le pidas a un LLM que adivine la URL de memoria** — eso ya lo descartamos por el riesgo de alucinación. Si no se encuentra ningún enlace razonable tras revisar el home y 1 nivel de navegación, la universidad se marca `sin_url_becas` y pasa a revisión manual, no se inventa nada.

### Fase C — Rastreo
Scrapy + `scrapy-playwright` sobre la URL encontrada. Debe manejar:
- Contenido JS-renderizado (ya cubierto por Playwright).
- **PDFs**: si la URL de becas resuelve a un PDF, enrutar a extracción de texto de PDF, no intentar parsear como HTML.
- Sub-enlaces: si la página es un índice con links a becas individuales, seguir un nivel adicional, no más.
- Reintentos con backoff exponencial (máximo 3 intentos) ante timeout o error transitorio.

### Fase D — Extracción con LLM (cliente agnóstico de proveedor)
Este es el componente nuevo más importante. Diseño:
- Una función central, por ejemplo `extract_scholarships(texto, provider)`, donde `provider` viene de una variable de entorno `LLM_PROVIDER` (`gemini` | `glm` | `deepseek`).
- Como el humano va a rotar de proveedor según disponibilidad, prioriza usar un cliente HTTP compatible con el formato de mensajes estilo OpenAI cuando el proveedor lo soporte (varios de estos exponen ese formato), para no triplicar la lógica de integración. Si algún proveedor no lo soporta, aíslalo en su propio adaptador pequeño, sin tocar la lógica central.
- Prompt con las mismas reglas anti-alucinación ya acordadas: si el texto no tiene becas aplicables, devolver lista vacía. Nunca inventar fechas, requisitos o enlaces que no estén en el texto fuente.
- La vigencia de una beca (¿aplica para el ciclo actual?) se extrae como **texto literal** de fecha si existe, nunca como un booleano decidido directamente por el modelo. El booleano final se calcula con código aparte, comparando esa fecha contra el calendario real.

### Fase E — Validación
Usa `becas_scraper/schemas.py` (`ScholarshipItem`) **tal cual existe**. No le cambies campos ni tipos sin aprobación — es el contrato que ya espera el backend del otro lado.

### Fase F — Checkpoint local (nuevo)
Un archivo dentro de `/scraper` (SQLite o similar; no toca la base de datos de Postgres de producción) que registra, por universidad: `pendiente`, `ok`, `error_playwright`, `error_pdf`, `sin_url_becas`, `sin_becas`, `baja_confianza`. Debe poder reanudarse sin reprocesar lo ya hecho.

### Fase G — Envío a `/ingest`
Ya existe del lado backend. El pipeline hace `POST` con `x-api-key: SCRAPER_API_KEY` y el `IngestScholarshipDto` correspondiente. No modifiques esa forma de datos.

### Fase H — Orquestación (esto es lo que reemplaza el trabajo manual "1x1")
Esta es la pieza que convierte todo lo anterior en algo automático de verdad, no solo un conjunto de funciones que hay que invocar a mano por universidad. Debe existir **un único punto de entrada** (por ejemplo `scrapy crawl becas_spider` o un `main.py`) que:

- Lee el checkpoint local (Fase F) y filtra automáticamente solo las universidades en estado `pendiente` o en un estado de error que aún admite reintento — nunca hay que decirle "ahora procesa la Universidad X", eso lo decide solo revisando el checkpoint.
- Procesa ese lote respetando la concurrencia y el rate limiting definidos (sección 4) — no dispara las 207 en paralelo de una vez.
- Actualiza el checkpoint **universidad por universidad, en tiempo real**, no al final del lote completo, para que si el proceso se corta a la mitad, no se pierda lo ya hecho.
- Al terminar el lote correspondiente a la etapa activa del rollout (sección 6), se detiene solo y genera el resumen de sesión (sección 7). **No avanza automáticamente a la siguiente etapa** — eso requiere que el humano confirme que se cumplió el criterio de avance. La automatización es dentro de cada etapa, no entre etapas.
- Puede apoyarse en `APScheduler` (ya está en las dependencias del proyecto) para correr por lotes en horarios definidos sin supervisión activa, pero el cambio de una etapa de rollout a la siguiente sigue siendo una decisión humana, nunca encadenada sola.

Con esto, tu única intervención manual real por etapa es correr un comando (o dejarlo agendado) y, después, revisar la cola de `/admin/revision` — no entrar universidad por universidad a buscar su página de becas.

---

## 3bis. Orden de implementación paso a paso (para el agente, no para correr las 207 de una)

No construyas todo de una vez ni pruebes directo contra las 207. Este es el orden recomendado, cada paso se valida antes de pasar al siguiente:

1. **Verificación de estado real:** confirmar con `GET /universities` si las 207 ya están cargadas en la base de datos (ver sección 0). Documentar el resultado antes de seguir.
2. **Entorno:** copiar `.env.example` a `.env` en `/scraper`, agregar las variables de LLM (sección 5), confirmar que `SCRAPER_API_KEY` coincide con la que espera el backend.
3. **Cliente LLM aislado:** construir `llm_client.py` y probarlo solo, con un texto de ejemplo pegado a mano (sin crawlear nada todavía), para confirmar que la extracción y la validación con `ScholarshipItem` funcionan antes de conectarlo a nada más.
4. **Fase A aislada:** la función que trae universidades desde `/universities`. Probar que devuelve la cantidad esperada.
5. **Fase B en 2-3 universidades de prueba:** descubrimiento de URL de becas. Revisar a mano si las URLs encontradas son correctas antes de escalar a más.
6. **Fase C sobre esas mismas 2-3 universidades:** el spider de rastreo con Playwright.
7. **Pipeline integrado (C→D→E) de punta a punta**, todavía solo con esas 2-3 universidades de prueba.
8. **Fase F y G:** checkpoint local y envío a `/ingest`. Confirmar que una beca de prueba aparece de verdad en `/admin/revision`.
9. **Recién ahora, Fase H (orquestación)** y la primera corrida real: Etapa 1 del rollout, 10 universidades (sección 6).

Si algún paso de este orden falla, se corrige ahí mismo antes de avanzar al siguiente — no se sigue construyendo sobre una pieza que no se validó.

---

## 4. Reglas de scraping impecable (no negociables)

- `ROBOTSTXT_OBEY=True` siempre. Nunca lo desactives, ni siquiera "temporalmente para probar".
- Rate limiting conservador: `AUTOTHROTTLE` activo, concurrencia baja por dominio (1-2 requests simultáneas por sitio), con una pausa mínima entre peticiones al mismo dominio.
- User-Agent identificable y honesto (ej. `BecasColombiaBot/1.0`), no un user-agent falsificado para evadir bloqueos.
- Timeout razonable por request (no dejar que un sitio caído cuelgue todo el batch).
- Nunca intentes sortear un login o paywall. Si el contenido de becas está detrás de uno, se marca para revisión manual.
- Todo error se clasifica y se loguea (ver sección 9), nunca se ignora en silencio.
- Nunca guardes la `SCRAPER_API_KEY` ni ninguna clave de LLM en el código. Todo vía `.env`, siguiendo la convención que ya usa el proyecto.

---

## 5. Configuración de LLM

Agrega a `scraper/.env.example` (sin valores reales) las variables nuevas necesarias, por ejemplo:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=
GLM_API_KEY=
DEEPSEEK_API_KEY=
```
El humano ya va a tener configurado `GEMINI_API_KEY` en su `.env` real (no en el `.example`) para el piloto inicial. No asumas que las otras claves están disponibles — si `LLM_PROVIDER` apunta a un proveedor sin clave configurada, es un error de configuración a reportar, no algo que debas resolver eligiendo otro proveedor por tu cuenta.

---

## 6. Etapas de ejecución (rollout)

No se avanza de etapa sin cumplir el criterio anterior, documentado en tu reporte de sesión.

| Etapa | Alcance | Criterio para avanzar |
|---|---|---|
| 1 — Piloto | 10 universidades, elegidas con diversidad de ciudades/regiones entre las 207 ya cargadas | El pipeline corre de punta a punta sin errores de código. Los resultados aparecen visibles en la cola de revisión del panel admin (`/admin/revision`). No importa aún la tasa de calidad. |
| 2 — Piloto ampliado | 30-40 universidades | Menos del 25-30% de registros en `baja_confianza`. Más del 70% de universidades logran que la Fase B encuentre una URL de becas válida sin intervención manual. |
| 3 — Corrida completa | El resto de las 207 | Solo si la Etapa 2 cumplió su criterio. Si no lo cumplió, el siguiente paso es ajustar Fase B o el prompt de extracción, no forzar la corrida completa. |

---

## 7. Formato de reporte al final de cada sesión

En español simple, sin asumir que el humano va a leer el código:

1. Qué se construyó o corrió en esta sesión.
2. En qué etapa va el rollout (tabla de la sección 6).
3. Cuántas universidades quedaron en cada estado del checkpoint (`ok`, `error_x`, `baja_confianza`, etc.).
4. Cualquier bloqueo, con su nivel (ver sección 9).
5. Próximo paso exacto y concreto.

---

## 8. Preguntas que debes hacerle al humano sin excepción

Nunca decidas esto por tu cuenta:

- Cambiar cualquier archivo dentro de `/backend` o `/frontend`.
- Cambiar el contrato de datos de `/ingest` (`IngestScholarshipDto`) o de `ScholarshipItem`.
- Activar o "completar" la sección de becas internacionales.
- Editar cualquier archivo `CLAUDE.md`.
- Desactivar `ROBOTSTXT_OBEY` o subir significativamente la concurrencia/velocidad de peticiones.
- Gastar dinero en cualquier servicio (APIs de pago, proxies, etc.), sin importar el monto.
- Cambiar el `LLM_PROVIDER` por defecto para una corrida grande sin que el humano lo confirme.

---

## 9. Protocolo de manejo de errores

- **Nivel 1 (resuelves solo, sigues):** timeout puntual, una universidad con 403/404, error transitorio de red. Reintenta con backoff, marca en checkpoint, continúa con las demás.
- **Nivel 2 (detienes esa parte, avisas en el reporte):** tasa de error alta en un lote (>20%), un proveedor de LLM agotó su cuota del día, un sitio cambió de estructura y el parser dejó de funcionar para ese caso puntual.
- **Nivel 3 (detienes todo, preguntas antes de seguir):** cualquier situación de la lista de la sección 8, o cualquier caso donde no tengas certeza de si es Nivel 2 o 3 — en la duda, siempre Nivel 3.

---

## 10. Definición de "terminado" para este módulo

El módulo scraper se considera completo cuando: las 207 universidades pasaron por el pipeline al menos una vez, el checkpoint no tiene ninguna en estado `pendiente`, y la cola de revisión del panel admin refleja el resultado real (aprobado, rechazado, o pendiente de revisión humana) — no antes, y no basado solo en que "el código corrió sin errores".
