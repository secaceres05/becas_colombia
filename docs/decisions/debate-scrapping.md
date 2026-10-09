# Decisión: Debate Scrapping — becas vs universidades

**Fecha:** 2026-10-08 · **Mesa:** Chair (Nibble), Pragmatist (Sprocket), Skeptic (Widget) · **Rondas:** 3/3 · **Escribe:** el Chair
**Pregunta:** ¿Seguir haciendo scraping de becas o comenzar scraping de universidades?

## Lo decidido

1. **Descubrimiento masivo de becas: CERRADO (unanimidad).** No más tandas spider/MCP sobre `pendiente_mcp`, `sin_url_becas`, antibot, SSL roto o `error_llm` crónicos. El gap residual de ESTADO_PROYECTO §17.3 sigue aceptado.
2. **Becas pasa a mantenimiento de vigencia, sin nuevos registros.** Se adopta la corrección del Pragmatist: la vigencia cubre las 231 VIGENTE (no solo las 53 URLs `ok` del spider, porque las becas vía MCP no están en esas URLs), priorizadas por tráfico. Re-chequeo de `official_url` + `status`; cero ingesta nueva salvo instrucción explícita de Juan.
3. **Piloto de universidades ×10: PREPARACIÓN autorizada ya, EJECUCIÓN con gate.** Se puede construir ahora: extractor, contrato Pydantic propuesto y salida local (SQLite/TSV). Crawlear las 10 requiere cumplir el gate (§ Gate).
4. **Cero cambios a `/backend` o `/frontend` en el piloto (unanimidad).** Un endpoint/DTO nuevo de ingesta es decisión exclusiva de Juan (plan §8, Nivel 3). Entrega por defecto: TSV para carga manual en CMS.
5. **Fuente SNIES/API oficial primero, HTML solo como fallback** para campos que SNIES no trae (`description`, `enrollmentUrl`, pasos/calendario). Reglas intactas: `ROBOTSTXT_OBEY=True`, UA honesto, sin stealth, sin paywall/login, claves solo en `.env`.
6. **Kill criteria del pivot:** <60% fichas completas o >20% sitios con antibloqueo → se cancela, queda solo mantenimiento.

## Por qué (evidencia que compraron los tres)

- Rendimiento marginal de becas ≈ 0: Tanda Verde solo 5/17 de `sin_url_becas` tenían becas reales; lo restante son IES micro-regionales, antibot Perfdrive/Radware, SSL roto y `error_llm` crónicos. Costo MCP manual alto por 1–2 becas de bajo tráfico.
- Catálogo de 236 publicadas ya sostiene la Fase 6; la beca #237 no desbloquea nada.
- El hueco visible es `/universidades/[id]` + `/admisiones` (placeholder de 6 hardcodeadas, `Program`/`AdmissionProcess` vacíos): 10 fichas completas aportan más que 10 becas marginales, con un backlog nuevo acotado (~30–50 filas, no 100+).

## Opciones que perdieron y por qué

- **"Ingesta top-15/20 en ventana 2026-2/2027-1" (Pragmatist R1–R2):** rechazada. Reabre descubrimiento por la puerta trasera sin gate, contra el backlog sin vaciar. Cualquier ingesta nueva futura es instrucción explícita de Juan, no calendario automático.
- **"Congelar también la preparación" (Skeptic):** rechazada. Preparar código ≠ crawlear sitios; desperdiciaría infra caliente (Playwright, checkpoint, `llm_client` operativos hoy) y no genera backlog.
- **"Piloto SNIES-only, cero HTML, máximo 5" (Skeptic):** rechazada en esos términos. SNIES da códigos/nombres, no descripciones, URLs de matrícula ni pasos de admisión; sin fallback HTML acotado no hay ficha. El ×10 (no ×5) se sostiene porque el piloto usa universidades grandes, donde no aplica el riesgo de infra regional que el Skeptic documentó.
- **"Ejecutar el piloto ya, sin gate" (Pragmatist R1):** rechazada. El cuello de botella es la revisión manual de Juan; extraer sin capacidad de revisión repite el error de los batches de becas.

## Gate de ejecución (lo fija Juan con números)

- Backlog `needs_review` < N (propuesta del Chair: 50).
- `LLM_PROVIDER` confirmado para la corrida.
- Deploy Fase 6: deseable antes de escalar más allá del piloto; no bloquea prepararlo ni correrlo.
- Las 10 universidades del piloto (propuesta: las más grandes/reconocidas, diversidad regional).

## Abierto / próximo paso exacto

1. Juan fija N, las 10 universidades y el `LLM_PROVIDER`.
2. El ejecutor construye el extractor con salida local y propone el contrato Pydantic (sin tocar `/backend`).
3. Tras el gate, se corre el piloto ×10 y se reporta en formato §7 del plan scraper (etapa, conteos por estado, bloqueos por nivel, próximo paso).
4. Con el reporte, Juan decide: aprobar endpoint de ingesta (Nivel 3), seguir con carga manual TSV, o matar el pivot según kill criteria.
