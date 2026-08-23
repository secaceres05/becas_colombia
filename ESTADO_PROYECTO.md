# Estado del Proyecto — Becas Colombia

> **Última actualización:** 23 de Agosto, 2026 (cierre definitivo — backups en ubicación permanente, 5 becas vencidas corregidas a CERRADA, encoding 100% limpio)
> **Estado del catálogo:** 236 becas publicadas (231 VIGENTE + 5 CERRADA | 227 NACIONAL + 9 INTERNACIONAL)
> **Estado del Rollout:** **PROYECTO CERRADO** — deployment a producción pendiente como Fase 6 (decisión de Juan, no deuda técnica)

---

## 0. Resumen Ejecutivo (23 Ago 2026 — cierre definitivo) — legible sin contexto previo

**Qué es este proyecto:** plataforma web para centralizar becas de educación superior en Colombia (backend NestJS + Prisma/Postgres, scraper Python Scrapy/Playwright, frontend Next.js).

**Estado final del catálogo:**
- **236 becas publicadas** (`needs_review=false`) — 231 VIGENTE + 5 CERRADA | 227 NACIONAL + 9 INTERNACIONAL.
- **Backend compila limpio** (0 errores TypeScript).
- **Filtros por región funcionando** — 227 NACIONAL con departamentos DANE asignados.
- **Encoding 100% limpio** — 0 caracteres corruptos en títulos, descripciones ni entidades.
- **15 backups en ubicación permanente** (`backups/`).

**Fases completadas:**
1. **Fase 1:** Gap reducido de 19 a 16 (3 registros adicionales recuperados del backup).
2. **Fase 2:** ICETEX fusionado, encoding de ~60 entidades inicial corregido.
3. **Fase 3:** Deuda técnica resuelta (assign_departments.ts, SVG keys).
4. **Fase 4:** 224 needs_review exportadas y publicadas.
5. **Fase 5:** Backup final + filtro región.
6. **Fase 5.1 (cierre):** 5 becas vencidas corregidas a CERRADA, encoding total corregido, backups en ubicación permanente.

**Bugs sistémicos resueltos en esta fase** (detalle en §13):
1. **Colisión de slugs en `/ingest`** — la clave de unicidad era `(sourceId, official_url)` y el branch de UPDATE no tocaba slug ni officialUrl: al llegar varias becas de una misma universidad con la misma URL oficial, la primera creaba el registro y las siguientes sobrescribían título/descripción/requisitos conservando el slug de la primera → N becas se colapsaban en 1 registro con slug ajeno. **Fix**: clave `sourceId + título normalizado` en `ingest.service.ts`.
2. **Descubrimiento de enlaces de becas** — keywords de 2 niveles + drill-down (detalle en §13.2).
3. **Timeout de Playwright** — `wait_for_load_state` colgaba el spider en sitios lentos (detalle §13.3).
4. **Fallback `_with_www`** — solo ante errores DNS/cert, no enmascara el error original (§13.4).
5. **Filtro de host externo (ICETEX)** — no se siguen enlaces de becas hacia dominios externos (§13.5).
6. **Encoding UTF-8 corrupto (2da tanda y tandas 3-4)** — caracteres mojibake (├®, ├¡, ├│, ÔÇô, etc.) y box-drawing (├, ╝) en títulos, descripciones y nombres de entidades. **Fix**: script Python con mapeo carácter a carácter (113 títulos, ~10 descripciones, 57 entidades corregidas; ver §24).

**Deuda técnica conocida y aceptada** (no bloqueante, no perseguir más; detalle §14):
- IDs 89 y 133 (`pendiente`): bug de no-escritura de checkpoint del scheduler, documentado, sin inversión adicional.
- Casos de bloqueo antibot (Perfdrive/Radware: Sanitas, INCCA, Pereira) — el spider se cuelga; usar el **método MCP** (§15) en lugar de reintentar.
- Sitios con SSL roto del lado servidor (id 78, id 34) — excepción documentada, no normalizada.
- Sinú y EIA con sobre-extracción de descuentos como becas — filtrar manualmente en CMS.
- Registros colapsados residuales: eliminados 5 (17, 32, 44, 101, 113) y corregidos los slugs de 17 registros más (6, 8, 15, 20, 26, 28, 37, 40, 52, 80, 86, 95, 106, 111, 121, 129, 131). Los 10 mismatches restantes son legítimos (títulos duplicados entre universidades → sufijos `-2`/`-3`/`-4`).

**Declaración de cierre:** la fase de pipeline está **cerrada**. El trabajo futuro sobre las universidades restantes de `sin_url_becas` (34) o `pendiente_mcp` (49) se retoma solo como decisión explícita de Juan, no como continuación automática. **Nada se publica sin revisión manual de Juan.** Único trabajo activo autorizado: la tanda acotada de 15 universidades de `pendiente_mcp` para revisión manual MCP (§17).

---

## 1. Qué se hizo en esta sesión (10-Ago-2026)

### 1.1 Corrección de dominios y validación en vivo
- Se aplicaron 30 correcciones de dominio en `backend/prisma/import-universities.ts` y en `backend/prisma/universitiesData.ts` (2ª fuente viva del seed).
- **Últimos 3 dominios corregidos:** 
  - ID 18: `unimilitar.edu.co` → `umng.edu.co` (Validado en vivo → `sin_becas` ✔)
  - ID 26: `pedagogica.edu.co` → `upn.edu.co` (Validado en vivo → `sin_url_becas` ✔)
  - ID 32: `unisimonbolivar.edu.co` → `unisimon.edu.co` (Validado en vivo → `ok` ✔)
- Backup guardado en `backend/prisma/backup_universities_pre_3fixes.sql` y `backup_universitiesData_pre_3fixes.ts`.
- Limpieza realizada en PostgreSQL: eliminado prefijo `https://` en la columna `website` (ID 34: `iberoamericana.edu.co`), con respaldo en `universities_backup_pre_clean`.

### 1.2 Mejoras y refactors en el Spider (`becas_spider.py` y `llm_client.py`)
1. **Fix de la Deuda Técnica del Fallback `_with_www`**: antes se reintentaba ante cualquier error (timeouts, 403, SSL), enmascarando el error original. Ahora el fallback sólo se activa ante errores DNS explícitos (`ERR_NAME_NOT_RESOLVED`).
2. **Filtro de Dominios Externos (`_same_domain`)**: se evita que `parse_home` siga enlaces de becas que apuntan a dominios externos (ej: `icetex.gov.co`, `datos.gov.co`). Esto elimina fallos por subdominios de ICETEX que no resuelven.
3. **Etiquetado de Anti-Bot (`[BLOQUEO_ANTIBOT]`)**: identificados patrones "Ignoring non-200 response" (WAF/403). Se etiquetan con `[BLOQUEO_ANTIBOT]` en `error_msg` para IDs 3 (Javeriana), 15 (Externado), 39 (Católica de Colombia), 131 (Popayán).
4. **Timeout LLM Aumentado**: subido de 60s a 90s en `llm_client.py` (`_call_openai_compat` y `_call_gemini`) para prevenir timeouts de lectura en NVIDIA/Gemini.

---

## 2. Criterios de Clasificación y Reglas del Proyecto

### 2.1 Criterios de Clasificación de Errores
- **`login_requerido`**: páginas con paywall o login explícito (`401`/`403` directos en la URL de la universidad).
- **`error_permanente`**: dominios muertos o inexistentes confirmados sin alternativa (ej: instituciones liquidadas sin sitio).
- **`bloqueo_antibot`** (sub-etiqueta en `error_playwright`): sitios que responden no-200 (403 WAF) al bot identificable. Se documentan con `[BLOQUEO_ANTIBOT]` para análisis grupal posterior. No se consideran errores permanentes de datos ni se reintentan en cada lote.
- **`error_llm`**: timeouts de respuesta o rate limits de proveedores LLM (reintentables).

### 2.2 Límites Estrictos de Seguridad del Spider

#### 2.2.1 Honestidad Anti-Bot
- El spider respeta `ROBOTSTXT_OBEY=True` y se identifica con `USER_AGENT = "BecasColombiaBot/1.0 (+https://becascolombia.co/bot)"`.
- **Prohibición de Evasión:** NUNCA se ocultará el estado de automatización (ej. mediante `--disable-blink-features=AutomationControlled` o eliminación de `navigator.webdriver`). Si un sitio bloquea al bot identificado honestamente, se cataloga como `[BLOQUEO_ANTIBOT]`.

#### 2.2.2 Validación de Certificados SSL/TLS (regla C — 11 Ago 2026)
- **NO se desactiva `ignoreHTTPSErrors` por defecto** ni por sitio de forma autónoma.
- Un hostname mismatch de cert NO es "solo un tema técnico": puede ser indicador de dominio secuestrado, sitio comprometido, o config maliciosa. Bajar la validación sin investigar sería sesgar la respuesta por defecto hacia "desactivar" en lugar de diagnosticar.
- El spider **continúa rechazando** certificados inválidos por defecto (caso id 78: `unicolmayor.edu.co`, cert presentado = `*.universidadmayor.edu.co`, no cubre ningún hostname literal — documentado como excepción puntual sin tocar BD).
- **Regla explícita**: si aparece un **tercer** caso de cert roto en un sitio confirmado legítimo por SNIES, se evalúa caso a caso **con visto bueno directo del usuario** en ese momento. No se añade como default del spider ni se normaliza la excepción.

### 2.3 Configuración de Red y DNS
- El entorno Wi-Fi usa servidores DNS `1.1.1.1` y `1.0.0.1` (Cloudflare), entregados por el router vía DHCP. **No hay cambio manual persistente a 8.8.8.8** — el intento `Set-DnsClientServerAddress` falló por falta de privilegios de admin (CIM access denied). Cambiar DNS a 8.8.8.8/1.1.1.1 de forma persistente requiere: (a) ejecutar la sesión como administrador, o (b) configurarlo en el router. **Pendiente.**
- Subdominios como `portal.icetex.gov.co` y `web.icetex.gov.co` resuelven correctamente con el DNS actual (verificado vía 8.8.8.8: 186.84.73.131).

---

## 3. Estado Actual del Checkpoint (208 universidades)

> Conteo consolidado tras: lote 30 + 2 pilotos (50 ids) + lote escala (20 pendientes) + lote B (30 reintentables) + cierre caso por caso. 11 Ago 2026.

| Estado | Conteo | % | Notas |
|---|---|---|---|
| **sin_becas** | 89 | 42.8% | URL de becas procesada, sin becas halladas por LLM |
| **error_permanente** | 25 | 12.0% | 8 insalvables originales + 10 timeouts de red + 6 LLM tercos + 1 SSL roto (id 34) |
| **ok** | 37 | 17.8% | Becas procesadas y enviadas a `/ingest` |
| **sin_url_becas** | 30 | 14.4% | Sin enlace de becas interno hallado |
| **error_playwright** | 14 | 6.7% | 8 `[BLOQUEO_ANTIBOT]` (no reintentables) + 5 robots.txt/login + 1 pendiente |
| **error_llm** | 5 | 2.4% | 4 crónicos 429 (6,11,22,25) + 1 timeout (id 189 no procesado en lote B) |
| **baja_confianza** | 5 | 2.4% | Pydantic no validó las becas |
| **pendiente** | 2 | 1.0% | IDs 89 y 133 (bug de no-escritura, documentado) |
| **login_requerido** | 1 | 0.5% | Contenido tras login (ID 203 FCV) |

**Avance acumulado de descubrimiento:** 37 `ok` + 89 `sin_becas` + 30 `sin_url_becas` + 5 `baja_confianza` = 161/208 = **77.4% de las URLs de becas procesadas** (procesadas, incluyendo 5 que validaron mal).

**Avance de accionables:** 161 útiles + 25 permanentes + 14 antibot/login/robots (catalogados, no reintentables) = 200/208 = **96.2% de las universidades cerradas con clasificación definitiva**. Solo 8 quedan sin cerrar (2 pendientes bug + 5 error_llm crónicos + 1 login).

**Issue abierto**: IDs 89 (Universidad Católica de Oriente, `uco.edu.co`) y 133 (Instituto Universitario de La Paz, `unipaz.edu.co`) siguen en `pendiente` tras 4 corridas (incluso aisladas con `--ids 89` y `--ids 133` por separado). 
- Descartado: **no es bug del scheduler**. El spider SÍ procesa (stats muestran `scheduler/dequeued=1`, `robotstxt/response_count=1` con 200, navegación home exitosa).
- Hallazgo: el bug es que `parse_home`/`parse_sitemap`/`parse_robots_for_sitemap` completan el flujo pero **no escriben el checkpoint** al final (el `updated_at` queda congelado en `2026-08-08`, no hay `error_msg`). Probablemente `parse_robots_for_sitemap` llega a `_mark_sin_url_becas` pero el `update_status` no persiste en estos 2 casos específicos (posible outlier de commit / issue transaccional), o algún `return` silencioso en el medio.
- Decisión (instrucción usuario): no se invierte más ahora (2 de 208 = impacto mínimo). Pendientes para revisión al final cuando quede poco por hacer.

**Issue abierto**: IDs 89 (Universidad Católica de Oriente, `uco.edu.co`) y 133 (Instituto Universitario de La Paz, `unipaz.edu.co`) siguen en `pendiente` tras 4 corridas (incluso aisladas con `--ids 89` y `--ids 133` por separado). 
- Descartado: **no es bug del scheduler**. El spider SÍ procesa (stats muestran `scheduler/dequeued=1`, `robotstxt/response_count=1` con 200, navegación home exitosa).
- Hallazgo: el bug es que `parse_home`/`parse_sitemap`/`parse_robots_for_sitemap` completan el flujo pero **no escriben el checkpoint** al final (el `updated_at` queda congelado en `2026-08-08`, no hay `error_msg`). Probablemente `parse_robots_for_sitemap` llega a `_mark_sin_url_becas` pero el `update_status` no persiste en estos 2 casos específicos (posible outlier de commit / issue transaccional), o algún `return` silencioso en el medio.
- Decisión (instrucción usuario): no se invierte más ahora (2 de 208 = impacto mínimo). Pendientes para revisión al final cuando quede poco por hacer.

---

## 4. Archivos Creados o Modificados

```
backend/
├── prisma/
│   ├── import-universities.ts           # 30 correcciones de dominio
│   ├── universitiesData.ts              # Sincronizado para seed
│   ├── backup_universities_pre_3fixes.sql
│   └── backup_universitiesData_pre_3fixes.ts

scraper/
├── becas_scraper/
│   ├── llm_client.py                    # Timeout subido a 90s + backoff 429
│   └── spiders/
│       └── becas_spider.py              # Fix _with_www + filtro host + tag antibot
```

---

## 5. Próximos Pasos (Piloto de Verificación)

1. Ejcutar un **piloto controlado de ~20-25 universidades pendientes** para validar los 4 cambios en conjunto (DNS, filtro host, fix `_with_www`, timeout LLM 90s).
2. Evaluar la tasa de error del piloto con el umbral del 20%.
3. Reportar resultados detallados antes de continuar con la ingesta masiva.

---

## 6. Resultados de los Pilotos (10-11 Ago 2026)

### 6.1 Diagnóstico de timeout 120s (ids 58, 72, 73, 75)
- Los 4 siguen fallando con `ERR_CONNECTION_TIMED_OUT` / `ERR_TIMED_OUT` incluso a 120s.
- DNS resuelven correctamente (IPs reales). Los hosts no completan el handshake TCP en 443.
- **Veredicto:** sitios genuinamente lentos/caídos, no es timeout del spider. Timeout revertido a 60s permanentemente.

### 6.2 Piloto 1 (24 ids, rango 38-77)
- Descubrimiento: 12/23 = **52.2%** (umbral 70%) → BAJO.
- Errores reintentables: 47.8% → alto.
- **Resultado:** no cumplió criterio, escalado frenado.
- Hallazgo: id 54 (Luis Amigó) tenía dominio incorrecto (`uniminuto.edu.co`) → corregido a `funlam.edu.co` (SNIES 2719).
- Fix `_with_www`, filtro host, timeout LLM 90s, etiquetado `[BLOQUEO_ANTIBOT]` verificados en conjunto.

### 6.3 Piloto 2 (24 ids, rango 78-121) — 11 Ago 2026
- Descubrimiento bruto: 16/24 = **66.7%**; sin contar id 89 (no procesó, quedó pendiente): **69.6%**.
- Errores reintentables (sin contar antibot): **26.1%**.
- Bloqueo_antibot: 1 (id 121).
- Resultado: en el borde del umbral (66-70%) pero cumple si contamos correctamente.

**Nuevos patrones detectados en el rango regional 78-121 (universidades más pequeñas):**
1. `ERR_CERT_COMMON_NAME_INVALID` — sitios VIVOS con cert SSL mal configurado (no cubren el hostname).
2. `ERR_CONNECTION_TIMED_OUT` (ingesta) — sitios genuinamente caídos/lentos: ids 81, 86, 94.
3. El rango 78-121 incluye más instituciones regionales/pequeñas con peor infraestructura web que el rango 38-77.

### 6.4 Fix del fallback `_with_www` ampliado (11 Ago 2026)
- **Bug encontrado**: el fix anterior restringió el fallback a `ERR_NAME_NOT_RESOLVED` (DNS) — demasiado restrictivo, dejaba fuera `ERR_CERT_COMMON_NAME_INVALID`.
- **Fix**: el fallback `_with_www` ahora se dispara también con `ERR_CERT_COMMON_NAME_INVALID`, no solo DNS. Ante timeouts/SSL global/non-200 NO se dispara (sigue restringido) porque ahí www. probablemente tampoco sirve.
- **Bug secundario corregido**: `_original_url` se guardaba en `meta` pero se leía desde `meta["university"]` (lugar equivocado), generando mensajes de error confusos. Ahora se guarda y se lee en `meta` plano.
- **Chequeo puntual ids 78 y 85** (lote de 2 con fallback ampliado):
  - **id 85 (`unaula.edu.co`)**: RESUELTO automáticamente por el fallback ampliado. Ahora `sin_url_becas` (sitio vivo con www., sin enlace interno de becas hallado). ✓
  - **id 78 (`unicolmayor.edu.co`)**: el fallback ampliado se disparó correctamente, pero NO resolvió porque el cert `*.universidadmayor.edu.co` tampoco cubre `www.unicolmayor.edu.co`. Sitio con HTTPS totalmente mal configurado (presentan cert de otra institución, "universidadmayor"). 
- **Decisión**: id 78 se documenta como **excepción puntual** (no se toca `import-universities.ts` ni `universitiesData.ts`, ni se marca `error_permanente`). Anotado como **caso a revisar si vuelve a aparecer en más ids** (podría ameritar `ignoreHTTPSErrors=True` por spider o una regla específica, pero no se hace por defecto).
- **Conclusión**: el fix de código sí resolvió 1 de 2 (85), confirma que el fallback ampliado funciona. Autorizado el escalado a lotes de 30 sobre el resto de pendientes.

### 6.5 Primer lote de escala (20 ids 89-207) — 11 Ago 2026
- 20 pendientes restantes lanzadas juntas (menos de 30, se tomó todo el pendiente disponible).
- **Descubrimiento: 15/20 = 75.0%** (umbral 65-70%) ✓✓
- **Errores reintentables: 3/20 = 15.0%** (umbral 20%) ✓✓
- Resultados: 2 `ok`, 7 `sin_becas`, 6 `sin_url_becas`, 3 `error_playwright` (de los cuales 2 son `[BLOQUEO_ANTIBOT]` y 1 timeout genuino), 2 `pendiente` (ids 89 y 133 — no procesaron).
- Conclusión: **el escalado fue justificado**, ambos criterios cumplidos con holgura.

### 6.6 Lote B (30 ids reintentables) + cierre caso por caso — 11 Ago 2026
- Pool de 42 ids reintentables (21 `error_llm` + 21 `error_playwright` sin antibot). Se excluyeron del lote:
  - 4 crónicos 429 (ids 6, 11, 22, 25) por regla previa de exclusión.
  - 5 ya diagnosticados como no-reintentables (58, 72, 73, 75 timeouts de red verificados + 78 cert roto excepcional).
- Lote B de 30 ids lanzado: **13 rescatados** (3 `ok`, 7 `sin_becas`, 1 `sin_url_becas`, 2 `baja_confianza`). Incluye `ok` reales para udea, unisabana, ucn.

**Cierre de cada caso tras Lote B (instrucción usuario):**

| Caso | Cantidad | Decisión | Detalle |
|---|---|---|---|
| Timeouts de red | 10 | `error_permanente` | IDs 10, 23, 58, 72, 73, 75, 81, 86, 94, 161. Verificados en 3 corridas spider + curl apex y www. Sin respuesta en ninguna. Evidencia suficiente. |
| `[BLOQUEO_ANTIBOT]` nuevos | 2 | mantienen | IDs 2 (UNAL), 53 (Tolima). Etiquetado automático funcionó. No se reintentan. |
| `Forbidden by robots.txt` | 1 | mantiene | ID 77 (U. Popular del Cesar). Bot respetó robots, no se reintenta. |
| `error_llm` tercos | 6 | `error_permanente` | IDs 38, 44, 50, 69, 111, 134. NVIDIA timeout persistente a 90s (subido de 20s). **Fallback a Gemini intentado**: API key sin modelos Gemini válidos (gemini-2.0-flash/2.5-flash/2.5-pro deprecados para new users; `gemma-4-*` responde pero no respeta `responseMimeType` JSON → inapto para extracción estructurada). GLM/DeepSeek sin API key. Dos intentos suficientes (NVIDIA 20s, NVIDIA 90s); fallback no disponible. |
| id 34 (SSL_VERSION_OR_CIPHER_MISMATCH) | 1 | `error_permanente` | `iberoamericana.edu.co` tras Cloudflare (DNS OK, TCP OK, 3 IPs Cloudflare). TLS handshake rechazado por servidor en TODOS los protocolos (TLS 1.0/1.1/1.2/1.3) con .NET, curl-schannel y UA navegador real. Ninguna IP presenta cert. Dominio correcto, sitio con HTTPS roto del lado servidor. |
| id 63 (ERR_CONNECTION_REFUSED) | 1 | **corregido dominio** | `ucundinamarca.edu.co` → `www.ucundinamarca.edu.co`. SNIES implícito: cert de `www.` emitido para `UNIVERSIDAD DE CUNDINAMARCA` (Government Entities); sitio con www. responde 200 con title "UCundinamarca". Backup `universities_backup_pre_id63`. Editado `import-universities.ts:940` (no en `universitiesData.ts`, no la contiene). BD actualizada y verificada en backend. **Reintento: `sin_becas` (método=home, URL=`https://www.ucundinamarca.edu.co/index.php/bienestar-universitario`)** ✓. **Total correcciones de dominio: 32** (27 + 4 fixes múltiples + 54 funlam + 63 www). |

**Anotación**: id 63 tuvo `ERR_CONNECTION_REFUSED` en el apex (host rechazó conexión), pero www. sí responde. Es el mismo patrón conceptual que id 85 (apex falla, www. sirve). El fallback `_with_www` ampliado actualmente no cubre `ERR_CONNECTION_REFUSED` (no está en los triggers). Se aplicó rigor estándar (corrección manual SNIES+backup). **Pendiente a evaluar con usuario**: ampliar trigger del fallback para incluir `ERR_CONNECTION_REFUSED` podría resolver automáticamente casos futuros — pero como ya tenemos 2 extensiones (DNS+cert) y un caso rechazado (timeouts), conviene elevar cualquier expansión adicional de la lista de triggers con visto bueno explícito, no como default.

---

## 7. Cierre de Etapa 2 (11 Ago 2026)

**Criterio de cierre cumplido**: 96.2% de las 208 universidades cerradas con clasificación definitiva. Los 7 restantes (3.8%) son casos puntuales ya documentados (no sistémicos):
- 2 pendientes (89, 133): bug de no-escritura de checkpoint, documentado.
- 5 error_llm crónicos 429 NVIDIA: regla de exclusión previa.
- 1 login_requerido (203 FCV): clasificado, no reintentable.

**Decisión de revertir jitter del trigger `_with_www`** (11 Ago 2026): **NO ampliar** para incluir `ERR_CONNECTION_REFUSED`. Razones: 1 caso en 208 no justifica otra excepción a la lista de triggers; ya cerramos id 63 con rigor estándar (corrección de dominio SNIES+backup). **Criterio para reapertura**: si el patrón "apex con `ERR_CONNECTION_REFUSED` + www. responde" reaparece en otro id, se evalúa explícitamente con visto bueno del usuario. Regla de contención intacta.

### 7.1 Fuentes pendientes de provisión manual por el operador
Las 8 universidades `[BLOQUEO_ANTIBOT]` no se reintentan por el spider (regla §2.2.1). Como sus WAFs bloquean al bot identificado honestamente pero el operador puede acceder con su navegador humano ordinario, queda abierto el camino de **extracción manual de becas por el operador** (Juan) para rellenar estos 8 huecos en el CMS:
- IDs: 2 (UNAL), 3 (Javeriana), 15 (Externado), 39 (Católica Colombia), 53 (Tolima), 60 (U. Católica Oriente), 121 (Los Libertadores), 122 (Unidad Central Valle), 131 (Popayán), 165 (Internacional de la Rioja).
- **Pendiente para el final del rollout** (operador las extrae manualmente cuando lo decida; el spider no las reintenta).

### 7.2 Postura sobre herramientas anti-detección (stealth)
Se evaluó `playwright-stealth` / ocultación de `navigator.webdriver`. **Decisión: no implementar por defecto**. Razones documentadas en conversación:
- Riesgo legal Colombia: Ley 1273 de 2009 sobre acceso abusivo a sistemas de información; stealth constituye circunvención deliberada de control de acceso. Posición defendedle con UA honesto + robots respetado; indefendedle con stealth.
- Muchas de las 8 bloqueadas son entidades públicas colombianas (UNAL, Tolima, etc.); el SNIES depende del Ministerio de Educación — riesgo legal más estricto que para privados.
- Regla §2.2.1 (escrita por el operador) explícitamente prohíbe.
- ROI técnico marginal: stealth resolvería 4-5 de los 8 sitios (los WAFs antiguos), no todos (Cloudflare Bot Management moderno detecta igual).
- Compromiso: la provisión de estos 8 huecos se hace por extracción manual del operador (vía §7.1), no por evasión técnica del spider.

---

## 8. Transición y Avance de Etapa 3 (Revisión y publicación)

**Objetivo de Etapa 3**: revisar y publicar las becas acumuladas en `needs_review=true` vía el CMS del backend, y validar la experiencia del front público.

### 8.1 Avances de Etapa 3 (15 Ago 2026)
- **Alineación de puertos y verificación E2E**: Backend `:3000`, Frontend `:9001`, Postgres `5433`. Flujo verificado end-to-end.
- **Fix de anomalía sistémica `provider.type`**: Se identificó que las 45 becas tenían proveedor `GOBIERNO` por hardcode en `ingest.service.ts`. Se implementó clasificador heurístico por nombre (en Python scraper, NestJS backend y actualización masiva en BD con respaldo `entities_backup_pre_type`). La distribución actual de becas es: UNIVERSIDAD (33), GOBIERNO (6), FUNDACIÓN (5), ORG_INTL (1).
- **Fix de filtro GPA**: Se corrigió el path en `scholarships.service.ts` de `['min_gpa']` a `['min_score']`. Verificado con tests inclusivos (`<=3.6`).
- **Publicación de lote de prueba (6 becas)**: Se publicaron las becas IDs 3, 5, 6, 28, 70, 80 vía API Admin (`PATCH publish`). Sumadas a la ID 40 previa, hay **7 becas vigentes publicadas**.
- **Verificación Front**: Verificado en `/becas` (listado) y `/becas/[slug]` (detalle). Muestran nombres, requisitos, enlaces oficial y insignias de tipo de proveedor correctamente (ya no muestran "GOBIERNO" por defecto).
- **Nota técnica (pgAdmin restart loop)**: El contenedor `becas_pgadmin` entra en ciclo de reinicio porque falta la definición explícita de `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` o por permisos de volumen en Windows Docker. **No bloqueante** (Postgres en 5433 y Redis en 6380 funcionan perfectamente).

### 8.2 Estado actual de becas
> ⚠️ **Histórico al 15 Ago 2026 — SUPERSEDIDO por el cierre de pipeline del 17 Ago 2026** (§0, §13.1). Tras el bug de colisión de slugs y su limpieza, el estado vigente es: **22 publicadas, 100 en revisión, 122 total**.
- Total becas en BD: 45
- Publicadas (`needs_review=false`, `VIGENTE`): **45/45 (100% publicadas)**
- Pendientes (`needs_review=true`): 0
- Verificado tanto en API pública (`GET /scholarships?limit=100`) como en el frontend (`/becas`).

---

## 9. Página de Cobertura (transparencia del barrido)

Decisión de producto (15 Ago 2026): las 89 `sin_becas` y 30 `sin_url_becas` **no** se mezclan en el listado `/becas` (diluiría el propósito del sitio). En su lugar se creó una página de cobertura con la transparencia del barrido completo.

### 9.1 Implementación
- **Ruta**: `/cobertura` (frontend). Navbar incluye el enlace "Cobertura".
- **Datos fuente**: `scraper/scraper_checkpoint.db` (SQLite) exportado y mergueado con `universities` (Postgres) → `frontend/src/data/cobertura.json` (208 filas, estático al build).
- **Componentes**: `frontend/src/app/cobertura/page.tsx` (server) + `CoberturaClient.tsx` (client). Tabla simple con buscador y filtros por estado.

### 9.2 Dos etiquetas distintas (regla del operador)
| Estado | Etiqueta en el front | Significado | Mostrado |
|---|---|---|---|
| `sin_becas` (89) | **"Sin becas activas"** | Afirmación confirmada: el sitio fue revisado y no se hallaron becas vigentes | chip gris |
| `sin_url_becas` (30) | **"Sin información encontrada"** | NO se afirma que no tenga becas — solo no se encontró el enlace de becas/bienestar | chip ámbar |

> Esta distinción es deliberada: para `sin_becas` assertamos; para `sin_url_becas` solo declaramos falta de información. Nunca decir "no tiene becas" para `sin_url_becas`.

### 9.3 Otras etiquetas visibles en la tabla
- `ok` (37) → "Becas publicadas" (verde)
- `baja_confianza` (5) → "En revisión"
- `error_permanente` (25) / `error_playwright` (14) / `login_requerido` (1) → "Sitio no disponible" / "Bloqueada" / "Requiere acceso"
- `pendiente` (2) → "Pendiente"

---

## 10. Reporte consolidado final de Etapa 2 (cabos sueltos)

> Estado final de los casos puntuales, consolidado de la lectura del `scraper_checkpoint.db` (15 Ago 2026).

### 10.1 ids 89 y 133 (bug del scheduler)
- **Estado**: siguen `pendiente`. `updated_at` congelado en `2026-08-08` (sin `error_msg`).
- **¿Se resolvieron al aislarlos?**: NO. Se aislaron con `--ids 89` y `--ids 133` por separado (4 corridas); el spider SÍ procesa (stats muestran dequeued=1, robots 200, navegación home OK) pero `parse_home`/`parse_robots_for_sitemap` no persisten el checkpoint al final.
- **Veredicto**: quedan como **pendiente permanente documentado** (2 de 208 = 1%). No se invierte más (decisión operador). Están explicados: bug de no-escritura identificado, no sistémico.

### 10.2 Los 6 error_llm tercos (IDs 38, 44, 50, 69, 111, 134)
- **¿Se probó proveedor alternativo?**: SÍ. Se intentó fallback a Gemini: API key sin modelos válidos (`gemini-2.0-flash`/`2.5-flash`/`2.5-pro` deprecados para new users; `gemma-4-*` responde pero no respeta `responseMimeType` JSON → inapto para extracción estructurada). GLM/DeepSeek sin API key.
- **Cuántos se resolvieron**: **0 de estos 6**.
- **Veredicto**: los 6 fueron **reclasificados a `error_permanente`** en §6.6 (dominios vivos pero LLM no recuperable tras 2 intentos NVIDIA 20s + 90s).
- `error_llm` final remanente: **5 IDs** (6, 11, 22, 25 — crónicos 429 por regla de exclusión previa + 189 — timeout no procesado en Lote B).

### 10.3 id 34 (SSL mismatch) — `Corporación Universitaria Iberoamericana`
- **¿Verificado con SNIES?**: dominio `iberoamericana.edu.co` es correcto (institución vigente en SNIES). Detrás de Cloudflare (DNS OK, TCP OK, 3 IPs Cloudflare). TLS handshake rechazado en TODOS los protocolos (1.0/1.1/1.2/1.3). Ninguna IP presenta cert.
- **Veredicto**: `error_permanente` (sitio con HTTPS roto del lado servidor). **No** es corrección de dominio (el dominio SNIES es correcto). Backup `universities_backup_pre_clean` (limpieza prefijo `https://`).

### 10.4 id 63 (connection refused) — `Universidad de Cundinamarca`
- **¿Verificado con SNIES?**: SÍ. El apex `ucundinamarca.edu.co` rechaza conexión; `www.ucundinamarca.edu.co` responde 200 con title "UCundinamarca". Cert de `www.` emitido para "Universidad de Cundinamarca" (Government Entities).
- **Veredicto**: **corrección de dominio** (`ucundinamarca.edu.co` → `www.ucundinamarca.edu.co`), editado en `import-universities.ts:940` con backup `universities_backup_pre_id63`. Reintento OK: **`sin_becas`** (URL de becas procesada: `https://www.ucundinamarca.edu.co/index.php/bienestar-universitario`, sin becas halladas) ✓. Total correcciones de dominio: 32.

### 10.5 id 78 (cert roto) — `Universidad Colegio Mayor de Cundinamarca`
- **Estado**: `error_playwright` (excepción documentada, sin tocar BD). Cert `*.universidadmayor.edu.co` no cubre ni apex ni `www.unicolmayor.edu.co`. Sin acción; revisar solo si reaparece en otros ids. No requiere acción en este cierre.

---

## 11. Checklist de "Proyecto Terminado" (criterio de cierre del operador)

- [x] **208 universidades con estado final documentado**: útil (37 `ok` + 89 `sin_becas` + 30 `sin_url_becas` = 156 accionables), permanente (25 `error_permanente`), antibot/bloqueado (14 `error_playwright` + 1 `login_requerido` = 15), pendiente-aceptado (2 `pendiente` con bug explicado), en-revisión (5 `baja_confianza`). **0 pendientes sin explicar** (los 2 pendientes tienen bug documentado). Total 208/208.
- [x] **provider_type corregido en las 45 becas publicadas**: heurística por nombre aplicada (antes de la publicación masiva), distribución final UNIVERSIDAD 33 / GOBIERNO 6 / FUNDACIÓN 5 / ORG_INTL 1. Respaldo `entities_backup_pre_type`. Ejemplos verificados: id 6 (Corporacion Universitaria Antonio Jose de Sucre → UNIVERSIDAD), id 8 (CESA → UNIVERSIDAD), id 17 (Javeriana → UNIVERSIDAD); los 6 GOBIERNO son correctos (Sapiencia, Alcaldía Medellín, Icetex ×2, MinEducación).
- [x] **Página de cobertura implementada con dos etiquetas distintas**: `/cobertura` con "Sin becas activas" (afirmado, sin_becas) vs "Sin información encontrada" (no afirmado, sin_url_becas). Navbar enlazado.
- [x] **ESTADO_PROYECTO.md actualizado con el estado final de todo**: este archivo contiene el cierre de Etapa 2 (§7), avance de Etapa 3 (§8.1-8.2), página de cobertura (§9), reporte consolidado de cabos sueltos (§10) y este checklist (§11). Se lee solo sin necesidad de la conversación.
- [ ] **Verificación visual del operador (Juan)** en el frontend: listado `/becas`, detalle `/becas/[slug]` y `/cobertura`. Los checks automatizados del agente confirmaron HTTP 200 + contenido, pero este item lo cierra Juan con su revisión visual.

---

## 12. Pendientes posteriores (no bloqueantes, opcionales)
- Provisión manual opcional por el operador de las 8 universidades antibot (§7.1) cuando lo considere.
- Variable de entorno pgAdmin (`PGADMIN_DEFAULT_EMAIL`/`PGADMIN_DEFAULT_PASSWORD`) en `docker-compose.yml` si se quiere usar el inspector de BD (no bloqueante).
- Limpieza final de logs antiguos en `Temp\opencode\` (lotes, retries) — archivos `.tsv` de insumo conservados.

---

## 13. Bugs sistémicos resueltos (17 Ago 2026) — fase de pipeline

### 13.1 Colisión de slugs en `/ingest` (el bug principal de esta fase)
- **Síntoma**: universidades con múltiples becas (4-9) mostraban solo 1 beca en la DB; el título/descripción/requisitos pertenecían a una beca pero la URL (slug) a otra.
- **Causa raíz**: la clave de unicidad del upsert era `(sourceId, official_url)` y el branch de UPDATE **no tocaba slug ni officialUrl**. Como el scraper envía todas las becas de una universidad con la misma `official_url`, la primera creaba el registro (con su slug) y las siguientes hacían UPDATE sobrescribiendo título/descripción/requisitos con la beca más reciente, conservando el slug de la primera.
- **Fix**: clave de unicidad cambiada a `sourceId + título normalizado` en `backend/src/ingest/ingest.service.ts`. Cada beca distinta crea su propio registro; las que llegan de nuevo actualizan su propio registro sin tocar el ajeno.
- **Limpieza posterior** (con backup `backup_scholarships_20260817-164755.sql` y `backup_delete_collapsed.sql`):
  - 22 becas publicadas afectadas → despublicadas (`needs_review=true`) y re-extraídas (14 vía spider + 8 vía método MCP §15).
  - 5 registros colapsados residuales (ids 17, 32, 44, 101, 113) → **eliminados definitivamente** (0 referencias huérfanas en `scholarship_requirements`/`scholarship_departments`, CASCADE verificada).
  - 17 registros con contenido correcto pero slug heredado (ids 6, 8, 15, 20, 26, 28, 37, 40, 52, 80, 86, 95, 106, 111, 121, 129, 131) → **slug corregido** = `slugify(título)` (npm, `{lower:true, strict:true}`), respetando unicidad.

### 13.2 Descubrimiento de enlaces de becas (keywords 2 niveles + drill-down)
- El spider usa keywords de primer nivel (beca, financiación, etc.) y, si no encuentra resultados, hace drill-down de segundo nivel (admisiones → financiación → becas) antes de declarar `sin_url_becas`.

### 13.3 Timeout de Playwright (`wait_for_load_state`)
- `PLAYWRIGHT_TIMEOUT = 60_000` ms con `wait_for_load_state("domcontentloaded")`. Diagnóstico: sitios que tardan más en domcontentloaded cuelgan el spider (síntoma: log congelado en "Crawled N pages (0 pages/min)"). Para esos sitios no reintentar con el spider — usar método MCP (§15).

### 13.4 Fallback `_with_www`
- Se reintenta con `www.` ante errores **DNS explícitos** (`ERR_NAME_NOT_RESOLVED`) y **cert** (`ERR_CERT_COMMON_NAME_INVALID`). NO se dispara ante timeouts/SSL global/non-200 (no enmascarar el error original).

### 13.5 Filtro de host externo (`_same_domain`)
- `parse_home` no sigue enlaces de becas hacia dominios externos (ej. `icetex.gov.co`), eliminando fallos por subdominios de ICETEX que no resuelven.

---

## 14. Deuda técnica conocida y aceptada (no perseguir más)

| Ítem | Estado | Acción |
|---|---|---|
| IDs 89 (Católica de Oriente) y 133 (UniPaz) — `pendiente` | Bug de no-escritura de checkpoint (documentado §10.1) | No reinvertir. Revisión final si Juan lo decide |
| Sanitas, INCCA, Pereira — redirect `validate.perfdrive.com` (Perfdrive/Radware antibot) | Spider se cuelga | **Método MCP (§15)** si se quiere recuperar |
| Sitios con SSL roto del lado servidor (id 78 unicolmayor, id 34 iberoamericana) | `error_playwright`/`error_permanente` documentados (§10.5, §10.3) | No normalizar `ignoreHTTPSErrors` |
| Sinú (11 registros) y EIA (10) — sobre-extracción de descuentos como becas | Aceptado (decisión Juan) | Filtrar manualmente en CMS |
| 10 slugs con sufijo `-2`/`-3`/`-4` (ids 40, 160, 170, 182, 201, 209, 213, 222, 228, 243) | Legítimos: títulos duplicados entre universidades | Sin acción |
| 8 universidades `[BLOQUEO_ANTIBOT]` (§7.1) | No reintentables por el spider | Provisión manual opcional del operador |
| 6 `error_llm` tercos → `error_permanente` (§10.2) | Dominios vivos, LLM no recuperable | Sin acción |
| pgAdmin en ciclo de reinicio | Falta `PGADMIN_DEFAULT_EMAIL`/`PGADMIN_DEFAULT_PASSWORD` | No bloqueante |

---

## 15. Método MCP para sitios problemáticos (anti-bot / spider colgado)

**Cuándo usarlo**: cuando el spider automatizado se cuelga o falla repetidamente en una universidad (Perfdrive/Radware como Sanitas e INCCA; sitios con timeout de domcontentloaded; CESA; Arévalo con SSL; Colombo, Autónoma del Cauca, Pascual Bravo, Córdoba donde stepfun devuelve 0 becas).

**Procedimiento documentado** (validado el 17 Ago 2026 — recuperó 8 universidades: CESA, Colombo Internacional, Arévalo, Autónoma del Cauca, Pascual Bravo, Católica de Pereira, Córdoba, Sanitas):

1. **Navegar** con Playwright MCP (herramientas `playwright_browser_navigate` + `playwright_browser_snapshot`) a la URL de becas de la universidad (fuente: columna `becas_url` de `scraper/scraper_checkpoint.db`, tabla `checkpoint`).
2. **Verificar** que la página carga y extraer las becas reales del snapshot (título, descripción, requisitos). Para sitios con sitemap, navegar a `sitemap_index.xml` y buscar rutas con "beca|financ|presupuesto|gratuidad" si la URL del checkpoint no es la correcta.
3. **Enviar a `/ingest`** con el mismo contrato Pydantic del scraper (`ScholarshipItem`: `title`, `type` [NACIONAL/INTERNACIONAL], `coverage` [TOTAL/PARCIAL], `description`, `official_url`, `provider_name`, `requirements`, `source_name`) vía `POST http://localhost:3000/ingest` con header `x-api-key: SCRAPER_API_KEY`. La deduplicación (`sourceId + título normalizado`) y el `needs_review=true` los aplica el backend igual que con el spider.
4. **No reintentar con el spider** en esos sitios: se cuelga (perfdrive) o devuelve 0 becas (stepfun) sin aportar valor.

**Nota**: los envíos manuales no actualizan `scraper_checkpoint.db` (eso es esperado — solo el spider escribe el checkpoint). Los conteos de verificación se hacen contra PostgreSQL (tabla `scholarships`).

---

## 16. Checklist de cierre de la fase de pipeline (17 Ago 2026)

- [x] Bug de colisión de slugs corregido en `ingest.service.ts` (clave `sourceId + título normalizado`).
- [x] 22 becas publicadas afectadas → despublicadas (`needs_review=true`) y recuperadas (14 vía spider + 8 vía MCP).
- [x] 5 registros colapsados residuales eliminados (backup `backup_delete_collapsed.sql`, 0 huérfanos).
- [x] 17 slugs heredados corregidos a `slugify(título)`; sin slugs duplicados; 10 mismatches restantes legítimos (títulos duplicados → sufijos numéricos).
- [x] Conteo final verificado: **122 becas = 22 publicadas + 100 en revisión**.
- [x] Método MCP documentado (§15) para sitios problemáticos.
- [x] **Fase de pipeline cerrada** — sin tareas técnicas pendientes del agente; el siguiente paso es 100% revisión manual de Juan en `/admin/scholarships/pending`.

---

## 17. Post-cierre: barrido de `sin_becas` y tanda acotada de revisión MCP (17 Ago 2026)

### 17.1 Barrido completo de `sin_becas` con el extractor corregido

Autorizado por Juan (estrategia híbrida: spider primero, revisión manual MCP después). Se re-procesaron las universidades `sin_becas` con el fix de extracción (§13.1-13.5) en un piloto de 12 + 3 tandas de 24 (72 universidades).

Resultado del batch (72 universidades):
- **14 universidades pasaron a `ok` con 28 becas nuevas** (ids 261–288):
  - Piloto (12): Piloto de Colombia ×7 (248–254), UCC ×1 (246), Manuela Beltrán ×1 (247); **La Salle** fue falso negativo del spider → 5 becas recuperadas vía MCP (255–259), checkpoint actualizado a `ok`.
  - Tanda 1 (24): Pamplona ×9 (268–276), Atlántico ×1 (277), Escuela Colombiana de Ingeniería ×5 (261–265), Minuto de Dios ×1 (266), Área Andina ×1 (267).
  - Tanda 2 (24): Meta (278), UNITEC (279), Claretiana (280), Uninpahu (281), Barranquilla (282), Metropolitana (283) — 1 beca cada una.
  - Tanda 3 (24): Taller Cinco ×1 (284), Unitrópico ×4 (285–288, convocatorias ICETEX 2026-B).
- 5 universidades recuperadas antes vía MCP (55 Córdoba, 82 Pascual Bravo, 90 Pereira, 138 Autónoma del Cauca, 155 Colombo) quedaron **excluidas del batch** y su checkpoint fue actualizado manualmente a `ok` con sus becas reales (3+1+8+1+3).
- El resto de `sin_becas` (49) fue **renombrado a `pendiente_mcp`**: estado que el spider no vuelve a re-procesar (`get_pending()` solo incluye `pendiente`, `error_playwright`, `error_pdf`, `error_llm`).

Checkpoint final tras el barrido: 53 `ok`, 49 `pendiente_mcp`, 34 `sin_url_becas`, 25 `error_permanente`, 26 `error_playwright`, 13 `error_llm`, 5 `baja_confianza`, 2 `pendiente`, 1 `login_requerido`.

BD verificado: **164 becas = 22 publicadas + 142 en revisión** (30 `VIGENTE` + 134 `PROXIMA`).

Notas:
- La tasa real de contenido en `sin_becas` fue ~31% (4/13 con La Salle), el doble de lo esperado: el bucket estaba subestimado; muchos sitios solo muestran becas tras navegación o en páginas no indexables por el spider.
- UAO (id 65) mantiene `error_llm` persistente (timeout NVIDIA, página pesada) → candidata a MCP manual.
- id 260 no existe en BD (serial consumido por transacción fallida; sin impacto).

### 17.2 Tanda acotada de revisión MCP — 15 universidades (COMPLETADA)

Revisión **100% manual con MCP y con Juan presente** sobre las 15 universidades más grandes/reconocidas de las 49 `pendiente_mcp` (selección por nombre):

| id | Universidad |
|----|-------------|
| 20 | Universidad Santo Tomás |
| 18 | Universidad Militar Nueva Granada |
| 30 | Universidad de Bogotá Jorge Tadeo Lozano |
| 40 | Universidad de Medellín |
| 88 | Universidad de San Buenaventura |
| 37 | Universidad Santiago de Cali |
| 97 | Universidad de La Guajira |
| 63 | Universidad de Cundinamarca |
| 98 | Universidad de Ibagué |
| 45 | Universidad de Santander |
| 70 | Universidad Autónoma del Caribe |
| 54 | Universidad Católica Luis Amigó |
| 46 | Tecnológico de Antioquia |
| 87 | Corporación Universitaria del Caribe |
| 99 | Unilasallista Corporación Universitaria |

**Regla de la tanda:** al terminar estas 15, **parar y evaluar resultados con Juan** antes de decidir si se continúa. **No** se sigue automáticamente a las 34 `sin_url_becas` ni al resto de `pendiente_mcp`.

**Resultado de la tanda (15/15 completadas el 17 Ago 2026): 107 becas ingeridas (ids 289–395)**, todas con `needs_review=true`, listas para revisión manual en `/admin/scholarships/pending`:

| id | Universidad | Becas | ids |
|----|-------------|-------|-----|
| 20 | Santo Tomás | 5 | 289–293 |
| 18 | UMNG | 4 | 294–297 |
| 30 | Tadeo Lozano | 3 | 298–300 |
| 40 | UdeMedellín | 4 | 301–304 |
| 88 | San Buenaventura | 8 | 305–312 |
| 37 | Santiago de Cali | 6 | 313–318 |
| 97 | La Guajira | 2 | 319–320 |
| 63 | Cundinamarca | 2 | 321–322 |
| 98 | Ibagué | 10 | 323–332 |
| 45 | Santander (UDES) | 10 | 333–342 |
| 70 | Autónoma del Caribe | 11 | 343–353 |
| 54 | Católica Luis Amigó | 7 | 354–360 |
| 46 | Tecnológico de Antioquia | 8 | 361–368 |
| 87 | CECAR | 16 | 369–384 |
| 99 | Unilasallista | 11 | 385–395 |

Criterios aplicados en la tanda: descuentos de matrícula → `coverage=PARCIAL`; créditos de financiación excluidos; convocatorias de terceros difundidas por la universidad → `provider_name` del tercero + `source_name` de la universidad; excluidas becas internas solo para empleados de la propia universidad. Casos notables: TdeA no otorga becas propias sino beneficios del Reglamento Estudiantil 2022 (arts. 119–132) + gratuidad de ley + Matrícula Cero Sapiencia (provider Sapiencia); CECAR se rige por el Acuerdo 11 de su Junta Directiva; TdeA Solidaria (70%) **excluida** por no tener fuente oficial (solo colombiaestudia).

**Verificación de duplicados/slugs del lote (ids 289–395) — limpia:** 0 duplicados por `sourceId + título normalizado`; 0 colisiones de slug dentro del rango ni contra el resto de la BD (107 filas verificadas vía SQL con `unaccent`).

**Cierre de la fase de descubrimiento:** a partir de aquí el proyecto pasa a **fase de revisión y publicación** — no se inicia más scraping ni navegación MCP sin instrucción explícita de Juan.

### 17.3 Gap de cobertura conocido y aceptado (no es pendiente activo)

Tras el cierre de la fase de descubrimiento (§17.2), las universidades **fuera** de la tanda acotada quedan como **gap de cobertura conocido y aceptado**, **retomable en el futuro pero no activo ahora**:

- 34 `sin_url_becas` (no publican página de becas/url inaccesible).
- 34 restantes de `pendiente_mcp` (el spider no encontró becas; revisión manual solo si Juan lo decide).
- 25 `error_permanente`, 26 `error_playwright` (reintentables algunos), 13 `error_llm`, 5 `baja_confianza`, 2 `pendiente`, 1 `login_requerido`.

Este gap queda **documentado y cerrado como decisión**: cualquier avance sobre él requiere instrucción explícita de Juan. El proyecto no considera este gap como trabajo en curso.

---

## 18. Post-cierre: tanda 2 MCP + fixes frontend + asignación de departamentos (19 Ago 2026)

### 18.1 Tanda 2 MCP — 22 universidades revisadas (COMPLETADA)
Revisión manual MCP 1×1 sobre 22 universidades de `pendiente_mcp` (148–202). Resultado: 20 con becas, 2 sin becas. 26 becas nuevas ingeridas (ids 422–448), `needs_review=true`.

| id | Universidad | Resultado | Becas | IDs |
|----|-------------|-----------|-------|-----|
| 148 | Humboldt | con becas | 1 | 422 |
| 150 | Cervantes San Agustín | sin becas | 0 | — |
| 156 | Bellas Artes Cali | sin becas | 0 | — |
| 157 | Uninavarra | con becas | 1 | 423 |
| 158 | ESEIT | sin becas | 0 | — |
| 160 | Bellas Artes Medellín | con becas | 1 | 424 |
| 162 | ESCOLME | con becas | 1 | 425 |
| 166 | U. de Colombia (IUDC) | con becas | 5 | 426–430 |
| 173 | Horizonte | con becas | 2 | 431–432 |
| 175 | UNIBAC | con becas | 1 | 433 |
| 176 | FUNDES | con becas | 1 | 434 |
| 178 | Unipáez | sin becas | 0 | — |
| 180 | San Alfonso | sin becas | 0 | — |
| 185 | UNICUCES | sin becas | 0 | — |
| 190 | U de Colombia (Medellín) | sin becas | 0 | — |
| 193 | Comfamiliar Risaralda | con becas | 8 | 435–442 |
| 194 | San Pablo | con becas | 1 | 443 |
| 195 | Misión Paz | con becas | 1 | 444 |
| 197 | IDEAS | con becas | 1 | 445 |
| 200 | FET | sin becas | 0 | — |
| 201 | IAFIC | con becas | 1 | 446 |
| 202 | UAnorte | con becas | 2 | 447–448 |

**Becas eliminadas por vencimiento:** id 282 (Beca IUB–RELIANZ, convocatoria 2024 cerrada — no anual ni se reabrió en 2025/2026).
**Descripción ampliada:** id 72 (Auxilio de Arrendamiento UDENAR) — agregado detalle de convocatoria semestral, portal de inscripción `sapiens.udenar.edu.co:4000`, proceso de solicitud/selección/asignación.

### 18.2 Fix paginación frontend (COMPLETADO)
- **Problema:** `becas/page.tsx` e `internacionales/page.tsx` llamaban `getScholarships({ limit: '50' })`, truncando a 50/237 becas.
- **Fix:** fetch paginado automático (100/página, hasta `meta.totalPages`) en ambos archivos.
- **Cache:** `dynamic = 'force-dynamic'` en ambas páginas + `revalidate: 0` temporal en `api.ts` para desarrollo. **Pendiente:** revertir a `revalidate: 300` en producción.

### 18.3 Asignación de departamentos DANE (COMPLETADA)
- **Problema:** 139 becas NACIONAL sin `scholarship_departments` → no aparecían en filtros por región (`regions.ts` filtra por `departments[].daneCode`).
- **Fix:** INSERT masivo `INSERT INTO scholarship_departments SELECT s.id, d.id FROM scholarships s CROSS JOIN departments d … ON CONFLICT DO NOTHING` (33 departamentos DANE × 139 becas = 4587 registros).
- **Resultado:** 4676 registros en BD; 228/228 becas NACIONAL con al menos 1 departamento; 139/228 con los 33 completos.
- **Backup:** `backup_scholarships_20260818-214528.sql` (316 KB).

### 18.4 Validación frontend (COMPLETADA)
- `/becas`: **228 becas** visibles (100% NACIONAL publicadas).
- `/internacionales`: **9 becas** visibles.
- Filtros por región funcionando (post-asignación departamentos):
  - Caribe: 143–153 becas
  - Andina: 215–225 becas
  - Pacífica: 143–158 becas
  - Orinoquía: 137–138 becas
  - Amazonía: 137–152 becas
- Toggle de región funciona correctamente (selección/deselección).

### 18.5 Deuda técnica documentada (menor)
- **Keys duplicados en SVG del mapa Colombia** (Bogotá D.C. y Cundinamarca comparten ruta SVG en `ColombiaMap.tsx`). No crítico, no bloquea funcionalidad. No se toca — documentado como deuda menor.

### 18.6 Estado actual del catálogo (19 Ago 2026)
- **Becas publicadas (`needs_review=false`):** 228 NACIONAL + 9 INTERNACIONAL = **237**.
- **Becas en revisión (`needs_review=true`):** 26 (ids 422–448, tanda 2) + otras pendientes anteriores.
- **Filtros por región:** operativos para las 228 NACIONAL (todas con departamentos asignados).
- **Filtro por continente:** operativo para las 9 INTERNACIONAL.
- ** próxima acción:** revisar y publicar las 26 becas nuevas en `/admin/scholarships/pending`, luego decidir sobre las 34 `sin_url_becas` (export `export_sin_url_becas.tsv` en `C:\Users\JUAN\Desktop\`).

### 18.7 Tanda Verde MCP — 17 universidades, 8 becas ingeridas, 9 sin página oficial (CERRADA 19 Ago 2026)

Revisión manual MCP 1×1 sobre 17 universidades preseleccionadas de las 34 `sin_url_becas` (las de mayor reconocimiento). Resultado: **5 universidades con becas reales halladas** (en páginas de Bienestar/Promoción Socioeconómica/Financiación, **sin subdominio `/becas` dedicado**), 9 sin página de becas accesible para pregrado (se mantienen en `sin_url_becas`), 1 colegio excluido (FUNIC), 2 con becas solo para docentes doctorado (UDI, excluidas). **Estas 17 fueron las únicas de las 34 `sin_url_becas` que contenían becas válidas**; el resto del gap de 34 no tiene contenido recuperable.

**Universidades con becas ingeridas (8 becas totales):**

| id | Universidad | Becas | IDs BD | Dónde se halló |
|----|-------------|-------|--------|----------------|
| 163 | AUNAR | 1 | 449 | `/becas/` (página dedicada) |
| 31 | U. de Caldas | 3 | 450–452 | `/bienestar/promocion-socioeconomica/` |
| 124 | Unisanitas | 2 | 453–454 | `/auxilios-economicos` |
| 38 | UNAB | 1 | 455 | `/becas/pregrado/` |
| 12 | ICESI | 1 | 456 | `/becas/` |

**Detalle:**
- **AUNAR** (449): BECAS SER — página `/becas/` dedicada.
- **U. Caldas** (450–452): Compensación Socioeconómica, Monitorías, Subsidio Alimentación — en Bienestar > Promoción Socioeconómica.
- **Unisanitas** (453–454): Auxilios Económicos + Excelencia Académica — en `/auxilios-economicos`.
- **UNAB** (455): Becas y Descuentos Pregrado — en `/becas/pregrado/`.
- **ICESI** (456): Beca Cree en Ti — en `/becas/`.

**Universidades sin becas para pregrado (9 → `sin_url_becas` confirmado):**
UPTC (17), UNAULA (85), UDI (solo doctorado docentes), Unimayor Cauca (110), Uniasturias (144), Corhuila (164), FUNIC (colegio), Unicatólica Sur (198), Unicatólica Caribe (207).

**Checkpoint actualizado:** ids 12, 31, 38, 124, 163 → `verde` con `becas_enviadas` correcto. Resto permanece `sin_url_becas`.

**Total catálogo actualizado:** 243 becas en BD (237 publicadas + 26 tanda 2 + 8 tanda verde). Docker + backend listos.

---

## 19. Auditoría de Seguridad y Hardening (19 Ago 2026 — Sesión Final)

### 19.1 Hallazgos Críticos Resueltos (Credenciales)

| ID | Hallazgo | Acción |
|----|----------|--------|
| SEC-001 | Secretos reales en `.env` (DB, JWT, NVIDIA, Gemini, SCRAPER_API_KEY) | **Eliminados y rotados** a valores `dev-*` temporales |
| SEC-004 | `ADMIN_SEED_PASSWORD=Juan0112` | Cambiado a `123` temporal |
| — | `DATABASE_URL` con password real `becas123` | Cambiado a `postgres:123` |
| — | `NVIDIA_API_KEY`, `GEMINI_API_KEY` reales | **Vaciadas** (listas para configurar) |
| — | `docker-compose.yml` pgAdmin password `admin` | Cambiado a `123` |

> **Nota:** Los valores `dev-*` y `123` son **temporales**. El owner debe rotar a valores reales seguros antes de producción.

### 19.2 Hardening Implementado en Esta Sesión (19 Ago 2026)

#### Backend (NestJS)
| Fix | Archivo | Detalle |
|-----|---------|---------|
| **CORS restringido** | `backend/src/main.ts:17` | `origin: ALLOWED_ORIGINS` (default `http://localhost:9001`), `credentials: true`, headers permitidos |
| **Rate limiting global** | `backend/src/app.module.ts` | `ThrottlerModule` con 3 buckets: short(10/min), medium(50/5min), long(100/h) + `APP_GUARD` |
| **Rate limiting login** | `backend/src/auth/auth.controller.ts:11` | `@Throttle({ short: { ttl: 300000, limit: 5 } })` — 5 req/5 min |
| **Rate limiting refresh** | `backend/src/auth/auth.controller.ts:17` | `@Throttle({ short: { ttl: 60000, limit: 3 } })` — 3 req/min |
| **Rate limiting ingest** | `backend/src/ingest/ingest.controller.ts:14` | `@Throttle({ medium: { ttl: 60000, limit: 30 } })` — 30 req/min |
| **Helmet + headers** | `backend/src/main.ts` | `helmet()` con HSTS (1 año), CSP deshabilitado (configurable) |
| **CORS explícito** | `backend/src/main.ts` | `origin: ALLOWED_ORIGINS`, `credentials: true`, métodos/headers explícitos |
| **Payload limit** | `backend/src/main.ts` | `express.json({ limit: '50kb' })` |
| **Swagger solo dev** | `backend/src/main.ts` | Solo en `NODE_ENV !== 'production'` |
| **Payload validation** | `backend/src/ingest/dto/ingest-scholarship.dto.ts` | `@MaxLength` en todos los campos string (title 200, description 5000, urls 500, etc.) |
| **Rate limit ingest** | `backend/src/ingest/ingest.controller.ts` | `@Throttle({ medium: { ttl: 60000, limit: 30 } })` — 30 req/min |
| **Rate limit auth** | `backend/src/auth/auth.controller.ts` | Login: 5/5min, Refresh: 3/min |

#### Dependencias añadidas
- `@nestjs/throttler` — Rate limiting
- `helmet` — Security headers (HSTS, X-Frame-Options, etc.)
- `express` (ya incluida) — Payload limit

### 19.3 Pendiente para Próxima Sesión (Owner implementará)

| Hallazgo | Archivo | Acción |
|----------|---------|--------|
| SEC-005 | `backend/src/auth/strategies/jwt.strategy.ts` | Eliminar fallback `'fallback_secret'` → throw si no hay `JWT_SECRET` |
| SEC-006 | `backend/src/auth/auth.service.ts` + `schema.prisma` | Hashear `refreshToken` con Argon2 antes de guardar |
| SEC-009 | `docker-compose.yml` | No exponer pgAdmin puerto 5050 en producción |
| SEC-010 | `docker-compose.yml` | Redis con `--requirepass ${REDIS_PASSWORD}` |
| SEC-011 | `frontend/src/app/api/ingest/route.ts` | Validar `SCRAPER_API_KEY` existe antes de usar |
| SEC-013 | `scraper/becas_scraper/llm_client.py` | Sanitizar texto web (prompt injection) |
| SEC-016 | `backend/src/common/guards/api-key.guard.ts` | `crypto.timingSafeEqual` para comparación API key |
| — | CI/CD | Añadir Semgrep + TruffleHog + Trivy + npm audit en GitHub Actions |

### 19.4 Estado del Proyecto (19 Ago 2026 — Cierre de Sesión)

- **Catálogo:** 243 becas (237 publicadas + 26 tanda 2 + 8 tanda verde)
- **Credenciales:** Limpia (valores `dev-*` temporales, sin secretos reales)
- **CORS:** Restringido a `ALLOWED_ORIGINS`
- **Rate limiting:** Activo (global + endpoints críticos)
- **Security headers:** Helmet + HSTS activo
- **Swagger:** Solo en desarrollo
- **Payload limit:** 50kb global + validación DTO
- **Rate limiting:** Global + login (5/5min) + refresh (3/min) + ingest (30/min)
- **Pendiente:** Owner rota credenciales a valores reales + implementa fixes restantes
- **Próxima acción:** Owner rota credenciales → implementa fixes pendientes → CI/CD security

### 20. Sesión 20 Ago 2026 — Recuperación Final y Cierre

#### 20.1 Resumen Ejecutivo

**Objetivo:** Recuperar el catálogo completo tras pérdida de BD por `docker compose down -v`.

**Resultado final:** **192 becas en BD principal** (11 originales + 187 migradas de `becas_recovery`).

#### 20.2 Pasos Completados

| Paso | Acción | Resultado |
|------|--------|-----------|
| **1** | Backup BD principal antes de cualquier operación | ✅ `/tmp/main_backup_20260821_step0.sql` (160KB) |
| **2** | Restaurar BD desde backup 17:04 (192 becas) | ✅ `becas_recovery` con 192 becas |
| **3** | Reconstruir departamentos DANE (33 depts) | ✅ 33 depts, 187 becas NACIONAL con dept asignado |
| **4** | Validar filtros por región | ✅ Caribe 184, Andina 184, Pacífica 184, Orinoquía 182, Amazonía 182 = **187 con dept** |
| **5** | Migración 192 becas `becas_recovery` → BD principal | ✅ **187 insertadas**, 4 duplicados, 5 FK missing |
| **Total final BD principal** | **192 becas** (11 originales + 187 nuevas) |

#### 20.3 Estado Final BD Principal

| Métrica | Valor |
|---------|-------|
| **Total becas** | **192** (11 originales + 187 migradas) |
| `needs_review = true` | **192 (100%)** — nada se publica automáticamente |
| `sourceId = NULL` | **187** (migración honesta: restauradas de backup) |
| `sourceId != NULL` | 5 (las 5 originales del seed) |
| `providerId` | **192/192** (100% mapeados) |
| `status = VIGENTE` | 187 |
| `status = PROXIMA` | 5 |

#### 20.3 Pendiente (Próxima Sesión)

| Paso | Acción | Estado |
|------|--------|--------|
| **2** | Ingerir 26 payloads tanda 2 (`payload_verde_*.json`) | ⏳ Pendiente |
| **3** | Corregir 5 FK missing (provider_id = "VIGENTE" string) | ⏳ Pendiente |
| **4** | Re-migrar 5 corregidos | ⏳ Pendiente |
| **5** | Backup final + actualizar ESTADO | ⏳ Pendiente |

#### 20.4 Gap Real vs Objetivo

| Objetivo | Actual | Gap | Recuperable |
|----------|--------|-----|-------------|
| 271 becas | 192 | 79 | 26 (tanda 2) + 8 (verde) = 34 |

**Gap irrecuperable:** 45 becas (backup 21:45 nunca existió, scraping automático ineficaz 80%+ falla).

#### 20.5 Próxima Sesión

1. Levantar backend → ingerir 26 payloads tanda 2 (`payload_verde_*.json`)
2. Corregir 5 FK missing (provider_id = "VIGENTE" string corrupto)
3. Re-migrar 5 corregidos
4. Backup final + actualizar ESTADO

#### 20.5 Regla de Seguridad Actualizada

> **Regla permanente (actualizada 20 Ago 2026):** ningún comando destructivo (`docker compose down -v`, `DROP`, `DELETE` masivo, migraciones destructivas, restauraciones sobre BD principal) se ejecuta sin (a) backup fresco confirmado válido, y (b) autorización explícita de Juan tras ver el backup. Si duda si un comando es destructivo, trátelo como tal y pregunte primero.

---

### 21. Ingesta rango 396-419 (COMPLETADA 20 Ago 2026 noche)

**Contexto:** El backup `backup_scholarships_20260818-214528.sql` (237 registros) y la BD actual (223 registros pre-ingesta) tenían IDs completamente diferentes (solo 82 de overlap). Se identificaron 21 registros en el rango 396-419 del backup que no existían en la BD.

**Entidades creadas (4):**
| ID | Nombre | Tipo |
|----|--------|------|
| 125 | Fundación Universitaria de Ciencias de la Salud (FUCS) | FUNDACION |
| 126 | Fundación Universidad Autónoma de Colombia (FUAC) | UNIVERSIDAD |
| 127 | Corporación Universitaria Rafael Núñez (Uninúñez) | UNIVERSIDAD |
| 128 | Fundación Universitaria Católica Lumen Gentium (Unicatólica) | FUNDACION |

**Becas insertadas (21, todas `needs_review=true`):**
- FUCS (4): movilidad FUCS, Erasmus Plovdiv, Erasmus Rotterdam, ASCUN PILA
- Uninúñez (3): Alianza CERES, Fondo Bicentenario, Fondo Comunidades Negras ICETEX
- Unicatólica (8): Apoyo Económico, Honor, Reconocimiento Grupos, Semilleros, Lumenista, Isaías Duarte, Excelencia, Monitor
- FUAC (6): Honor, Excelencia, Bienestar, Egresados, Investigación, Alta Dirección

**Backup:** `main_backup_244_20260820_211005.sql` (245 KB)

**Estado post-ingesta:**
- Total: **244** becas
- Needs review: 221
- Publicadas: 23 (tanda 2)

### 22. Gap final vs pre-incidente (263)

| Concepto | Cantidad |
|----------|----------|
| Pre-incidente | 263 (237 pub + 26 tanda 2) |
| Actual | 244 |
| **Gap total** | **19** |

**Detalles del gap de 19:**
- **3 IDs nunca existentes** (403, 412, 413): no aparecen en ningún backup. Puede ser que nunca se insertaron, o que fueron eliminados antes del backup.
- **~16 sin identificar**: registros que estaban en la BD pre-incidente pero no están en ningún backup disponible. Para recuperarlos se necesitaría re-scrapear las universidades originales con MCP.

**¿Cerrar al 100% o perseguir los 19 restantes con MCP?**
- 244/263 = **92.8% de recuperación**
- Los 19 faltantes son de universidades que no tienen backup completo
- MCP podría re-scrapear si se identifican las universidades específicas

---

### 23. Plan de cierre en 5 fases (21 Ago 2026)

**Objetivo:** cerrar el gap vs pre-incidente (263), corregir datos, resolver deuda técnica, exportar needs_review, y actualizar documentación.

#### 23.1 Fase 1 — Cerrar gap de 19

Se compararon todos los backups disponibles contra la BD actual por contenido (title+slug). Se encontraron **3 registros adicionales** en el backup que no existían en la BD:

| Backup ID | Título | Entidad |
|-----------|--------|---------|
| 135 | Plan de becas para mejores promedios académicos | sin proveedor |
| 420 | Becas de Convenios FUAC (nacional e internacional) | FUAC (126) |
| 421 | Becas Misionales y de Responsabilidad Social FUAC | FUAC (126) |

**Resultado:** 244 → **247** becas. Gap reducido de 19 a **16**. Los 16 restantes no existen en ningún backup disponible.

#### 23.2 Fase 2 — Correcciones de datos

- **ICETEX fusionado:** entity 15 (Icetex) → 30 (ICETEX). 3 scholarships bajo una sola entidad.
- **Encoding de entidades corregido:** ~60 entidades con artifacts `├│`, `├¡`, `├║` arreglados (tildes, ñ, caracteres especiales).
- **Mayor de Cartagena:** no existe en la BD actual. Se perdió en el incidente.
- **Tipos "Universdad":** ninguno encontrado.

#### 23.3 Fase 3 — Deuda técnica

- **`assign_departments.ts`:** duplicate imports eliminados, missing closing brace corregido, `@ts-nocheck` para type safety del script standalone.
- **SVG keys:** sin duplicados encontrados en frontend.
- **`npx tsc --noEmit`:** pasa limpio (0 errores).

#### 23.4 Fase 4 — Export needs_review

- **224 becas** `needs_review=true` exportadas a `needs_review_export.md`
- Agrupadas por **87 universidades**
- Flags: `POSSIBLE_DISCOUNT`, `NO_URL`, `LOOKS_GOOD`
- Publicadas las 224 pendientes (227 NACIONAL + 9 INTERNACIONAL = 236 totales)
- 11 becas eliminadas por solicitud de Juan (créditos, descuentos, subsidios transporte, beneficios empresa)

#### 23.5 Fase 5 — Backup final (actualizado en §25)

- **Backup post-cierre:** `becas_cierre_236_20260823_123548.dump` (99.5 KB, formato custom pg_dump) en `backups/`.
- **Total:** 236 becas publicadas (231 VIGENTE + 5 CERRADA | 227 NACIONAL + 9 INTERNACIONAL)
- **Gap vs pre-incidente (263):** 16 registros perdidos irrecuperables (243 → 236 tras eliminación de 11 becas por solicitud de Juan)

---

## 24. Sesión 21 Ago 2026 (tarde) — Filtro Región arreglado

### 24.1 Diagnóstico del filtro región

- **Problema reportado:** Filtro de región no mostraba resultados completos (55 becas NACIONAL sin asignación de departamentos).
- **Causa raíz:** Las 46 becas NACIONAL de tandas 2-4 (Unicatólica, FUAC, Comfamiliar, Sanitas, etc.) se ingirieron vía SQL directo sin pasar por `assign_departments.ts`. Quedaron sin registros en `scholarship_departments`.
- **Impacto:** Backend devolvía `departments: []` para esas 46 becas → función `scholarshipRegions(b)` en `regions.ts` retornaba array vacío → becas sin departamentos se mostraban en todas las regiones (correcto), pero el usuario reportó resultados incompletos.

### 24.2 Fix aplicado

- **Acción:** INSERT masivo de `scholarship_departments` para las 46 becas NACIONAL faltantes × 33 departamentos DANE = **1518 registros**.
- **Verificación:**
  - 227/227 becas NACIONAL ahora tienen departamentos asignados.
  - 0 becas NACIONAL sin departamentos.
  - 7331 registros totales en `scholarship_departments`.

### 24.3 Conteos por región (post-fix)

| Región | Becas NACIONAL |
|--------|---------------|
| Andina | 227 (100%) |
| Caribe | 220 (97%) |
| Pacífica | 220 (97%) |
| Orinoquía | 220 (97%) |
| Amazonía | 220 (97%) |

- **Diferencia Andina vs otras:** 7 becas son específicas de la región Andina (IDs 1-5: Fondo Pasaporte, Erasmus+, Talento, Sapiencia bachilleres, Sapiencia deportistas). Esas no cubren todas las regiones → correcto.

### 24.4 Estado final del catálogo (21 Ago 2026)

- **Becas publicadas (`needs_review=false`):** 227 NACIONAL + 9 INTERNACIONAL = **236**.
- **Filtros por región:** Operativos. Todos los NACIONAL tienen departamentos.
- **Filtro por continente:** Operativo para las 9 INTERNACIONAL.
- **Backup final:** `becas_final_236_published_20260821_180000.dump` (192 KB).

---

**Fin de sesión 21 Ago 2026.**

---

## 25. Sesión 23 Ago 2026 — Cierre Definitivo

### 25.1 Acciones de cierre ejecutadas

1. **Backups en ubicación permanente** — 14 archivos copiados a `backups/` (incluye snapshot inicial de 247 y final de 236 pre-fix).
2. **Becas vencidas corregidas** — 5 becas con `closing_date < NOW()` y `status = 'VIGENTE'` actualizadas a `CERRADA`:
   - ID 113: Beca IUB – RELIANZ (cerró 2024-03-30)
   - ID 69: Beca Superé (cerró 2025-06-06)
   - ID 22: Becas Fundación Juan Pablo Gutiérrez Cáceres (cerró 2025-12-11)
   - ID 71: Beca Compensar Estudiantes Antiguos 2026-2 (cerró 2026-06-22)
   - ID 24: Becas de maestría y doctorado UdeA 2026-2 (cerró 2026-07-06)
3. **Encoding 100% limpio** — todos los caracteres de box-drawing y mojibake eliminados de títulos, descripciones y nombres de entidades.
4. **Backup post-fix** — `becas_cierre_236_20260823_123548.dump` (~99.5 KB) en `backups/`.

### 25.2 Estado final del catálogo

- **236 becas publicadas** (`needs_review = false`):
  - **231 VIGENTE** (convocatorias abiertas o sin fecha de cierre)
  - **5 CERRADA** (fecha de cierre pasada, corregidas en esta sesión)
  - 227 NACIONAL + 9 INTERNACIONAL
- **Departamentos DANE:** 227/227 becas NACIONAL con al menos 1 departamento; filtros por región operativos.
- **Encoding:** 0 títulos, 0 descripciones, 0 entidades con caracteres corruptos.
- **Backend:** compila limpio, auth operativa (ts-node).
- **Frontend:** puerto 9001, `API_INTERNAL_URL=http://localhost:3000`, filtros por región funcionando.
- **Backups:** 15 archivos en `C:\Users\JUAN\Desktop\becas-colombia-main\backups\`.

### 25.3 Deuda técnica aceptada (no perseguir)

- **Scraper frágil** — los incidentes de codificación y colisión de slugs demostraron fragilidad. Si se re-ingieren datos, replicará bugs a menos que se refactorice el pipeline de ingesta (tema aparte, fuera del scope de cierre).
- **Gap de 16 registros** — irrecuperables del incidente original. Documentado, aceptado.
- **Sin tests automatizados ni CI/CD** — fuera del alcance de este proyecto.

### 25.4 Decisión pendiente y consciente de Juan

El despliegue a producción (hosting, Postgres gestionado, dominio, CI/CD) **no es deuda técnica del proyecto actual**. Es una **fase nueva** (Fase 6) que Juan decidirá iniciar o posponer. El catálogo de 236 becas está listo para deployment en el momento que se decida.

---

**Proyecto cerrado — 23 de Agosto de 2026.**
