# Historial de Rollout — Becas Colombia (Etapa 2)

> **Propósito:** Trazo de auditoría de los scripts Python temporales usados durante la Etapa 2 del rollout del scraper. Cada script se agrupa por su función. Se crearon en `C:\Users\JUAN\AppData\Local\Temp\opencode\` y se borran tras esta consolidación, pero su propósito y resultado quedan registrados aquí para la auditoría de Etapa 3.

---

## 1. Consultas al checkpoint (SQLite)

- **`checkpoint_list.py`**: volcado completo del estado del checkpoint (208 universidades) ordenado por `university_id`. Resultado: primer mapeo de distribución de estados tras el lote inicial.
- **`checkpoint_batch.py`**: agrupa el conteo de estados por lotes de Universidad IDs (en bloques de 50). Resultado: detectó agrupamientos anómalos y sesgos por rango geográfico.
- **`pendientes.py`**: lista IDs con `status='pendiente'`. Resultado: identificación de los 65 pendientes antes del segundo piloto; reducción a 20 tras lote de escala; a 2 tras lote B (89 y 133, que quedaron pendientes por bug de no-escritura).
- **`ver_checkpoint.py` / `verif_final.py`**: volcado interpretado con clases para debugging interactivo. Resultado: validación post-lote de que los conteos globales cuadraban con la suma de los deltas individuales.
- **`medir_uso_llm.py`**: medición del uso acumulado de tokens LLM por proveedor (NVIDIA/Gemini). Resultado: control del costo de los timeouts persistentes y justificación de no subir timeout LLM indefinidamente.

## 2. Diagnóstico DNS y prechequeo

- **`dns_precheck.py`**: verificación previa al lanzamiento del spider para 4 universidades objetivo. Comprobaba si los dominios resolvían con 1.1.1.1, 8.8.8.8 y 1.0.0.1 (aposición de Cloudflare/Google). Resultado: detectó los dominios con DNS inconsistente (ut.edu.co que quedó caído intermitente).
- **`dns_check.py`** / **`dns_all.py`**: extensión del precheck a todos los dominios en BD. Resultado: catalogación de los que resolvían en algunos resolvers pero no en otros (utp.edu.co, uniboyaca.edu.co, etc., que luego se confirmaron como casided).
- **`dns_domains.py`**: listado de todos los dominios en BD con su estado de resolución DNS. Resultado: base para la corrección manual de los 30+ dominios muertos.

## 3. Corrección de dominios muertos

- **`query_https.py`**: busca sitios con prefix `https://` en la columna `website` de la BD PostgreSQL (que causaba `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` en id 34). Resultado: hallazgo de solo 1 sitio con el prefix (id 34, iberoamericana.edu.co).
- **`clean_websites.py`**: remueve prefix `https://` en BD. Resultado: 1 UPDATE (id 34), con backup `universities_backup_pre_clean`.
- **`backup_id54.py`**: crea `universities_backup_pre_id54` y actualiza el dominio muerto de id 54 (Luis Amigó: `uniminuto.edu.co` → `funlam.edu.co`, verificado por SNIES 2719). Resultado: 1 UPDATE confirmado.
- **`update_id54.py`**: script auxiliar que ejecuta propiamente el UPDATE. Resultado: dominio cambiado en BD y backend.
- **`check_id54.py`**: verificación post-update (snapshot de id 54 por backend). Resultado: dominio `funlam.edu.co` presente, sitio responde 200.

## 4. Análisis de patrones de error

- **`query_errors.py`**: lista todas las universidades con `error_msg` no nulo, agrupo por tipo. Resultado: identificado el patrón `ERR_NAME_NOT_RESOLVED` en ICETEX (10, 110, 188), anti-bot "Ignoring non-200" en (3, 15, 39, 131), timeouts/enmascarado.
- **`pilot_errors.py`**: desglose de errores durante el primer piloto de 24. Resultado: reveló que el bug `_with_www` enmascaraba timeouts de red.
- **`pilot_status.py`**: snapshot de estados durante primer piloto. Resultado: primer reporte de avance con % de descubrimiento (52.2%).
- **`pilot2_classify.py`**: reclasificación de los 6 `error_playwright` del segundo piloto en antibot vs site-down. Resultado: 1 antibot, 5 site-down (que se marcaron permanentes).

## 5. Verificación del extractor y sitemap (debug específico)

- **`repro_playwright.py`**: reproducción aislada de la navegación Playwright para X universidad (URL configurable). Resultado: depuración de errores "Ignoring non-200" durante el desarrollo.
- **`test_sitemap_cesa.py`**: test específico del parser sitemap para id 94 (CESMAG). Resultado: confirmó que el sitemap no listaba URLs de becas. id 94 luego marcado permanente por timeout de red.
- **`test_extractor_fix.py`**: validación del fix `_with_www` ampliado para `ERR_CERT_COMMON_NAME_INVALID`. Resultado: se confirmó que id 85 (unaula) resolvía con `www.` automáticamente.

## 6. Diagnóstico del bug de timeouts de red

- **`list_timeout_permanent.py`**: enumera todos los IDs `error_playwright` con `ERR_CONNECTION_TIMED_OUT` o `ERR_TIMED_OUT`. Resultado: 10 IDs identificados (10, 23, 58, 72, 73, 75, 81, 86, 94, 161) que se marcaron permanentes.
- **`diag_retry.py`**: consulta el estado de los 4 IDs diagnosticados con 120s (58, 72, 73, 75) tras el reintento. Resultado: 4/4 seguían fallando → etiquetado como "sitios genuinamente lentos/caídos".

## 7. Marcado masivo de permanentes

- **`mark_permanent_timeouts.py`**: UPDATE de 10 errores de red a `error_permanente` con etiqueta `[PERMANENTE]` (3 intentos + curl). Resultado: 10 UPDATEs exitosos, conteo `error_permanente` 8 → 18.
- **`mark_llm_permanent.py`**: UPDATE de 6 timeouts LLM tercos a `error_permanente` con `[PERMANENTE LLM_TIMEOUT]`. Resultado: 6 UPDATEs; `error_llm` 11 → 5.
- **`mark_id34.py`**: UPDATE del único caso `SSL_VERSION_OR_CIPHER_MISMATCH` (id 34, iberoamericana) con etiqueta `[PERMANENTE SSL_ROTO]`. Resultado: 1 UPDATE, evidencia suficiente (TLS fallido en todos los protocolos/clientes/IPs).

## 8. Resultado del fallback a Gemini

- **`gemini_results.py`**: inspecciona estado de los 6 IDs reintegrados con `LLM_PROVIDER=gemini` (38, 44, 50, 69, 111, 134). Resultado: todos fallaron con `404 Not Found` — la API key Gemini no tiene acceso a modelos Gemini válidos (gemini-2.0-flash deprecado, gemma-4-* no respeta `responseMimeType`). Sello: fallback no disponible, IDs marcados permanentes.

## 9. Resultados agregados de los lotes

- **`lote1_detail.py` / `lote30_results.py`**: breackdown por id del primer lote de escala (20 pendientes) y del segundo (lote B de 30 reintentables). Resultado: primer lote 75% descubrimiento (cumple), segundo lote 43% bruto pero 13/30 rescatados que resultaron de un pool pre-filtrado (esperado).
- **`pilot2_results.py`**: similar para el segundo piloto de 24. Resultado: 66.7-69.6% descubrimiento (borde del umbral).
- **`loteB_results.py`**: similar para lote B. Resultado: 13/30 rescatados, 17 errores remanentes catalogados caso por caso.
- **`pilot_78_85.py`**: resultado del chequeo puntual tras ampliar el trigger del `_with_www`. Resultado: id 85 resuelto (`sin_url_becas`), id 78 no resuelto (cert no cubre ni `www.` ni apex) marcado como excepción documentada.

## 10. Tests de backend y BD durante los fixes

- **`schema.py`**: inspecciona el esquema de la tabla checkpoint (columnas y tipos). Resultado: descubrió que la columna `becas_url` no existe — es solo `error_msg`.
- **`query_tables.py`**: lista las tablas preexistentes en la BD para verificar backups. Resultado: confirmó `universities_backup_pre_clean`, `universities_backup_pre_id54` presentes.
- **`check_dups.py` / `check_dups2.py`**: verifica duplicados en BD por `official_url + title`. Resultado: 0 duplicados, dedupe del backend funciona correctamente.
- **`tag_antibot.py`**: rastrea el etiquetado `[BLOQUEO_ANTIBOT]` en IDs 3, 15, 39, 131 tras el primer fix de tagging. Resultado: 4 IDs correctamente etiquetados en `error_msg`.

## 11. Utils varios

- **`estado.py`** / **`estado0.py`**: volcados interpretados del estado del checkpoint con porcentajes y contadores. Resultado: reportes iterativos para cada conversación con el operador.
- **`list_sinurl.py`**: lista universidades `sin_url_becas`. Resultado: base para consulta al operador en Etapa 3 sobre cómo mostrarlas en el front.
- **`list_llm.py`**: lista los IDs `error_llm` con su tipo de error (timeout vs 429). Resultado: distinción útil para separar los 6 timeouts tercos de los 4 crónicos 429.
- **`q_cubr.py` / **`q_metodo.py`**: queries sueltas de cobertura por método de descubrimiento (home/sitemap_directo). Resultado: medición de eficacia del sitemap vs home.
- **`verif_nav.py`**: traza navegación de Playwright para un id (interactivo). Resultado: debugger durante investigación de bugs de scheduler.
- **`revisar_sitios.py`**: barrido de websites de universidades pendientes. Resultado: usada como input para diagnóstico de lotes.
- **`sucre_chain.py`**: test de cadena de redirecciones para id 105 (U. de Sucre). Resultado: identificación del subdominio activo para la U. de Sucre.
- **`dead_status.py`**: snapshot de IDs en estados muertos (`error_permanente`, `login_requerido`). Resultado: confirmación de los 8 + 1 = 9 permanentes pre-bloque del lote B.

## 12. Scripts fallidos / experimentales

Varios scripts (`test_sitemap_cesa.py`, `repro_playwright.py`) fueron provisionales y fracasaron en su propósito original — no se completaron pero quedaron codificados como traza. Otros (`medir_uso_llm.py`) producían salida inválida y se sustituyeron por consulta directa al backend.

---

## Resumen de scripts a borrar (todos los listados arriba)

- 51 archivos Python en `C:\Users\JUAN\AppData\Local\Temp\opencode\`
- Ninguno es parte del repo (`becas-colombia-main`); todos son auxiliares desechables.
- Su trazo de auditoría queda preservado en este documento.

**Decisión**: borrar todos los scripts listados en la siguiente operación de cleanup, conservando este archivo (`HISTORIAL_ROLLOUT.md`) como registro.
