# GAP por Universidad: 237 (pre-incidente) vs 200 (actual)

## Línea de Tiempo

| Momento | Becas en BD | Fuente |
|---------|-------------|--------|
| 17:04, 18 Ago 2026 | **191** | Backup `becas_backup_20260818_170457_utf8.sql` (parseado) |
| 17:04 → ~21:45, 18 Ago | **~237 publicadas + 26 tanda 2 = ~263** | Spider + MCP session (§17, §18 ESTADO_PROYECTO) |
| ~21:45, 18 Ago 2026 | **237 publicadas** (228 NAC + 9 INT) | Validación frontend `/becas` + `/internacionales` (§18.4) |
| ~21:45, 18 Ago 2026 | **263 totales** (237 pub + 26 tanda 2 needs_review) | §18.6 ESTADO_PROYECTO |
| ~21:45, 18 Ago 2026 | **0** | `docker compose down -v` → destrucción total |
| 20 Ago, post-restauración | **192** (11 orig + 187 migrados) | Restore from 17:04 backup + migración |
| 20 Ago, +verdes | **200** (192 + 8 green payloads) | Ingesta AUNAR, Caldas×3, Sanitas×2, UNAB, Icesi |

## Número de referencia: 237

El usuario confirmó **237** como el conteo "antes" correcto:
- 228 becas NACIONAL publicadas (visibles en `/becas`)
- 9 becas INTERNACIONAL publicadas (visibles en `/internacionales`)
- Verificados el 18/08 en la sesión de validación del frontend

**Nota:** Además de las 237 publicadas, había **26 becas en revisión** (tanda 2, IDs 422–448) con `needs_review=true`. El total real en BD antes del incidente era **263**. Las 26 tanda 2 están **completamente perdidas** (IDs no existen en la BD actual).

## Gap total: 237 − 200 = 37 becas perdidas

### Desglose

| Categoría | Becas | Estado actual |
|-----------|-------|---------------|
| Recuperadas del backup 17:04 | 191 → 187 migradas | ✅ En BD actual |
| Originales del seed | 11 | ✅ En BD actual |
| Green payloads (nuevas) | 8 | ✅ Ingeridas esta sesión |
| **Tanda 2 MCP (IDs 422–448)** | **26** | ❌ **PERDIDAS — sin snapshot** |
| **Gap sin identificar** | **11** | ❌ **PERDIDAS — sin datos** |
| **Total perdidas** | **37** | |

## Universidades con becas PERDIDAS — Tanda 2 (IDs 422–448)

Estas 26 becas fueron ingeridas el 19 Ago 2026 (§18.1) y **no existen en la BD actual**. Son reconstruibles vía MCP.

| # | Universidad | Becas perdidas | IDs originales | Prioridad | URL de referencia |
|---|-------------|----------------|----------------|-----------|-------------------|
| 1 | Comfamiliar Risaralda | 8 | 435–442 | **ALTA** | §18.1 |
| 2 | Universidad de Colombia (IUDC) | 5 | 426–430 | **ALTA** | §18.1 |
| 3 | Horizonte | 2 | 431–432 | MEDIA | §18.1 |
| 4 | UAnorte | 2 | 447–448 | MEDIA | §18.1 |
| 5 | Humboldt | 1 | 422 | MEDIA | §18.1 |
| 6 | Uninavarra | 1 | 423 | MEDIA | §18.1 |
| 7 | Bellas Artes Medellín | 1 | 424 | MEDIA | §18.1 |
| 8 | ESCOLME | 1 | 425 | MEDIA | §18.1 |
| 9 | UNIBAC | 1 | 433 | MEDIA | §18.1 |
| 10 | FUNDES | 1 | 434 | MEDIA | §18.1 |
| 11 | San Pablo | 1 | 443 | MEDIA | §18.1 |
| 12 | Misión Paz | 1 | 444 | MEDIA | §18.1 |
| 13 | IDEAS | 1 | 445 | MEDIA | §18.1 |
| 14 | IAFIC | 1 | 446 | MEDIA | §18.1 |

**Total tanda 2:** 26 becas en 14 universidades

## Gap sin identificar: 11 becas

Estas 11 becas estaban en la BD pre-incidente (parte de las 237 publicadas) pero **no están en la BD actual** (200). Sin un snapshot de la BD pre-incidente, no se pueden identificar individualmente.

**Posibles causas:**
- Becas eliminadas manualmente antes del incidente
- Becas que colapsaron por el bug de slugs (§13.1) y no se recuperaron
- Becas de tandas anteriores que no se migraron correctamente

**Recomendación:** Después de reconstruir las 26 tanda 2, comparar el total resultante (200 + 26 = 226) contra 237. Las 11 restantes se identifican por descarte.

## Acción recomendada (orden de prioridad)

1. **Comfamiliar Risaralda** (8 becas) — MCP directo, mayor impacto
2. **U. de Colombia IUDC** (5 becas) — MCP directo
3. **Horizonte** (2 becas) — MCP directo
4. **UAnorte** (2 becas) — MCP directo
5. **Humboldt, Uninavarra, Bellas Artes Med, ESCOLME, UNIBAC, FUNDES, San Pablo, Misión Paz, IDEAS, IAFIC** (1 c/u) — MCP directo
6. Evaluar gap restante (11) tras reconstruir tanda 2

## Nota sobre la tabla comparativa anterior

La tabla comparativa del GAP anterior (vs 192) mostraba 2 universidades con diff < 0:
- Fundación Universitaria Antonio de Arévalo (−3)
- Icetex (−2)

Estas diferencias se deben a **encoding corruption** en el backup 17:04, no a pérdidas reales. Con la referencia correcta (237), el gap real es **37 becas**, no 5.
