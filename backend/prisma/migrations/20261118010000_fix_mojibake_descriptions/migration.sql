-- Corrige caracteres corruptos (mojibake UTF-8 leído como CP437) en dos descripciones
-- cargadas por 20261118000000_seed_public_catalog. Idempotente: si ya no hay
-- coincidencias, REPLACE no cambia nada y el WHERE no actualiza filas.

-- "N┬░." -> "N°."
UPDATE "scholarships"
SET "description" = REPLACE("description", '┬░', '°')
WHERE "slug" = 'beca-maria-lucia-garcia-de-mojica'
  AND "description" LIKE '%┬░%';

-- "┬½" -> "«"  y  "┬╗" -> "»"
UPDATE "scholarships"
SET "description" = REPLACE(REPLACE("description", '┬½', '«'), '┬╗', '»')
WHERE "slug" = 'becas-para-el-cambio-convocatoria-975-de-minciencias'
  AND ("description" LIKE '%┬½%' OR "description" LIKE '%┬╗%');
