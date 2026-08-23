# Becas encontradas por universidad — Navegación supervisada

Fecha: 17 de agosto 2026
Método: Playwright MCP headed, supervisado por Juan. Sin headless, sin stealth.
Estado: se actualiza al completar la revisión de cada universidad.

---

## Tanda A2 — falsos negativos confirmados

### id 27 — Universidad de La Salle (Bogotá)

- Página de becas: https://lasalle.edu.co/es/financiacion-y-becas/becas
- Programa de Becas 2026: https://lasalle.edu.co/es/noticias/programa-de-becas-2026
- Becas renovables toda la carrera (Acuerdos 071, 072 y 075 de 2025), estudiantes nuevos regulares, valores fijos por programa (ej. Ingenierías $6.636.000, Bioingeniería $7.303.000, Arquitectura $7.799.000, Lic. Educación Básica $3.010.000, Maestría Estudios Sociales $5.074.000, Lic. Ed. Religiosa 60%, etc.).

| Beca | Cobertura | Notas |
|------|-----------|-------|
| Programa de Becas 2026 | valor fijo por programa (renovable) | pregrado y posgrado, estudiantes nuevos |
| Beca Académica de Honor | — | mérito académico, pregrado y posgrado |
| Beca de Inmersión Universitaria | — | estudiantes de grado 11, colegios con convenio |
| Becas Profesores, cónyuges e hijos | 25–50% matrícula | según categoría docente y tiempo de servicio |
| Becas Administrativos e Hijos | 25–50% matrícula | según nivel salarial y tiempo de servicio |

- Otros: Incentivos (mérito/fidelización), Auxilios (vulnerabilidad), Convenios de descuento.
- Diagnóstico: la ruta /es/financiacion-y-becas/becas no se exploró (quedó en la página genérica de financiación).

### id 30 — Universidad de Bogotá Jorge Tadeo Lozano (UTadeo)

- Micrositio financiación: https://www.utadeo.edu.co/es/micrositio/financia-tu-matricula
- Sección convocatorias de becas: https://www.utadeo.edu.co/es/link/cooperacion-nacional-e-internacional/93196/becas

| Beca | Cobertura | Notas |
|------|-----------|-------|
| Beca Soy Tadeísta | 50% matrícula (2 becas) | 2026-1, liderazgo/participación, inscripciones hasta 2-feb-2026 |
| Becas Volemos más Alto | — | 2026-2, trayectoria y liderazgo de estudiantes pregrado |
| Beca 50% Pregrado y Posgrado | 50% matrícula | auxilio otorgado por donante, pregrado y posgrado |
| Becas FDU (Fundación Desarrollo Universitario) | 100% toda la carrera | estudiantes primer semestre, excelencia académica, promedio 4.0+ |

- También: Alianza 4x1 Opción de Vida (ICETEX-Cundinamarca), Alianza Jóvenes a la E2 (ATENEA), convocatorias internacionales (DAAD, AECID, MSCA, SSHN).
- Página de "Descuentos" solo tiene convenios por entidad (egresados, cajas de compensación, etc.) — NO son becas.
- Diagnóstico: el spider quedó en la página de financiación genérica (créditos/descuentos) y no llegó a las convocatorias de becas (en /es/noticias y en la sección de Cooperación/Internacional).

### id 43 — Universidad Sergio Arboleda (Bogotá)

- Página de becas: https://www.usergioarboleda.edu.co/admisiones/becas/

| Beca | Cobertura | Notas |
|------|-----------|-------|
| Beca Mejores Puntajes Pruebas Saber 11 | 50% (≥420 pts) / 40% (≥410) / 20% (≥400) | renovable toda la carrera con promedio ≥4.3 |
| Becas Comunidades Indígenas y Afrodescendientes | 70% matrícula (4 becas/semestre) | renovable hasta graduarse con promedio ≥3.6 |
| Beca Programa de Honores Rodrigo Noguera Laborde (Escuela Mayor de Derecho) | totales o parciales | mérito académico (promedio ≥4.3), pregrado/posgrado/maestría/doctorado |
| Becas Talento Nacional (Escuela de Artes y Creación) | 70% matrícula | Música (clásica/colombiana/popular) y Teatro Musical; convocatoria abril y octubre; promedio ≥4.0 |

- Diagnóstico: el spider quedó en la página de "Apoyo Financiero" (créditos/entidades) y no llegó a /admisiones/becas/.

### id 40 — Universidad de Medellín (UdeMedellín)

- Página de becas: https://admisiones.udemedellin.edu.co/becas-descuentos-y-financiacion/
- Beca Social (propia): https://app.udem.edu.co/BecaSocial/

| Beca | Cobertura | Notas |
|------|-----------|-------|
| Beca Social | hasta 100% o 50% matrícula | pregrado, ingresos familiares hasta 3.5 SMMLV, prioridad 2 primeros puestos del colegio; renovación con promedio y 40h servicio social |
| Beca Mejores Bachilleres (Sapiencia) | 100% matrícula | mejor resultado Icfes Saber 11 de cada I.E. pública de Medellín |
| Beca Mejores Deportistas (Sapiencia) | 100% matrícula | deportistas medallistas del Municipio de Medellín |
| Créditos condonables Sapiencia (pregrado/posgrado) | matrícula hasta 5.5 SMMLV/semestre + sostenimiento hasta 2.5 | IES privadas del Valle de Aburrá |
| Becas Fraternidad Medellín (Comfama + FFM) | cobertura de semestres pendientes + manutención hasta 4 SMMLV/sem | alianza con Comfama; 15-40 años; convocatoria 2025-1 |
| Auxilio Educativo 2026-1 | $500.000 (alimentación + efectivo) | estudiantes pregrado en vulnerabilidad; Coopetraban/Crearcoop |

- Diagnóstico: el spider solo vio la financiación por créditos de la página principal; las becas propias y de Sapiencia están en admisiones.udemedellin.edu.co.

---

## Tanda A1 — falsos negativos confirmados

### id 1 — Universidad de los Andes (Bogotá)

- Portal de becas: https://apoyofinanciero.uniandes.edu.co/
- Página maestra: https://aspirantes.uniandes.edu.co/es/pregrado/servicios-financieros

| Beca | Cobertura | URL |
|------|-----------|-----|
| Beca Preferente | 5–50% matrícula | https://apoyofinanciero.uniandes.edu.co/beca-preferente |
| Beca Decidí Enseñar | 66% | https://apoyofinanciero.uniandes.edu.co/decidi-ensenar |
| Beca Quiero Estudiar | hasta 95% | https://apoyofinanciero.uniandes.edu.co/quiero-estudiar |
| Beca Quiero Enseñar | hasta 95% | https://apoyofinanciero.uniandes.edu.co/quiero-ensenar |
| Beca Pa'lante Pacífico | hasta 98% | https://apoyofinanciero.uniandes.edu.co/palante-pacifico |
| Beca Yerly (Matemáticas) | % matrícula | https://apoyofinanciero.uniandes.edu.co/beca-henry-yerly |

Nota: NO son becas — Préstamo Progresandes (crédito), descuento hermanos, beca hijos de empleados.
Diagnóstico: el spider visitó decanaturadeestudiantes (bienestar genérico), no el portal de apoyos financieros.

---

### id 5 — Universidad del Valle (Cali)

- Convocatoria Becas Doctorales SGR: https://viceinvestigaciones.univalle.edu.co/convocatorias-y-ofertas/becas
- 45 becas doctorales periodo 2026-1, 20 programas de doctorado, crédito educativo condonable.
- Diagnóstico: el spider visitó vicebienestar (subsidio de alimentación), no la vicerrectoría de investigaciones.

---

### id 7 — Universidad del Rosario (Bogotá)

- URL maestra: https://urosario.edu.co/financiacion/becas

| Beca | Cobertura | URL |
|------|-----------|-----|
| Beca Mérito URosario Pruebas de Estado | hasta 100% | https://urosario.edu.co/financiacion/becas/becas-merito-urosario-pruebas-de-estado |
| Beca Mérito URosario | descuento semestral | https://urosario.edu.co/financiacion/becas/beca-merito-ur |
| Becas Sueño Ser UR-Colsubsidio | 95% (10 becas/año) | https://urosario.edu.co/financiacion/becas/becas-sueno-ser-ur-colsubsidio |
| Beca Deportista Destacado | 90% | https://urosario.edu.co/financiacion/becas/beca-deportista-destacado |
| Beca Mérito URosario Internacional | hasta 100% | https://urosario.edu.co/finaciacion/becas/beca-merito-urosario-internacional |
| Becas Apoyo Socioeconómico | variable | https://urosario.edu.co/financiacion/becas/becas-de-apoyo-socio-economico |
| Beca UR Semilla | 30% + 70% sin interés | https://urosario.edu.co/financiacion/becas/beca-semilla |
| Beca Fundación Diego y Lía | 50–80% (2026-2) | https://urosario.edu.co/beca-fundacion-diego-y-lia-2026-2 |
| Beca Rescate Fundación Ventanas | 50% posgrado | https://urosario.edu.co/financiacion/becas/beca-rescate-fundacion-ventanas |
| Becas de Internacionalización | varias | https://urosario.edu.co/ur-internacional/becas |

Diagnóstico: el spider visitó /financiacion (genérica: créditos/entidades), NO el submenú /financiacion/becas.

---

### id 12 — Universidad ICESI (Cali)

- URL maestra: https://www.icesi.edu.co/becas/ (tabs: Becas para aspirantes / Becas para estudiantes)

| Beca | Cupos | URL |
|------|-------|-----|
| Becas Institucionales | — | https://www.icesi.edu.co/becas/becas-institucionales-2/ |
| Becas Empresariales | — | https://www.icesi.edu.co/becas/becas-empresariales/ |
| Beca Icesi Cree en Ti | 40 (calendario A) | https://www.icesi.edu.co/becas/beca-icesi-cree-en-ti/ |
| Beca Talento Excepcional | 85 (calendario A) | https://www.icesi.edu.co/becas/beca-talento-excepcional/ |
| Becas Yo Elijo ser Profe | 25 (A/B) | https://www.icesi.edu.co/becas/becas-yo-elijo-ser-profe/ |
| Beca Yo Amo ser Profe | 15 (A/B) | https://www.icesi.edu.co/becas/becas-yo-amo-ser-profe/ |
| Beca Icesi Conecta | 30 (A/B) | https://www.icesi.edu.co/becas/beca-icesi-conecta/ |
| Beca Icesi Inspira | 40 (calendario B) | https://www.icesi.edu.co/becas/beca-icesi-inspira/ |
| Becas Yo Quiero ser Profe | 40 (A/B) | https://www.icesi.edu.co/becas/becas-yo-quiero-ser-profe/ |
| Becas Icesos | 40 (A/B) | https://www.icesi.edu.co/becas/icesos/ |
| Beca a la Excelencia Académica | — | https://www.icesi.edu.co/becas/beca-icesi-a-la-excelencia-academica/ |

Contacto: Oficina de Apoyo Financiero, apoyofinanciero@icesi.edu.co, ext 4512 (becas) / 4513 (ICETEX).
Diagnóstico: enlace directo "Becas y financiación" en el menú principal; el spider no llegó a /becas.

---

### id 13 — Universidad del Norte (Barranquilla)

- Página maestra: https://www.uninorte.edu.co/pagos-y-financiacion
- Convocatoria Becas Pregrado 2026 (inicio 2-mar, cierre 15-may): https://www.uninorte.edu.co/web/apoyo-financiero/becas-pregrado

| Beca | Cobertura | Notas |
|------|-----------|-------|
| Beca Pro-Excelencia Promigas | 100% matrícula + idiomas + manutención | región Caribe, últimos 3 años |
| Beca Marvel Moreno | hasta 50% | solo mujeres; ingenierías, Economía, Música, Matemáticas, Administración |
| Beca Álvaro Jaramillo Vengoechea | hasta 80% | todos los programas excepto Medicina/Odontología |
| Beca Orgullo Caribe | hasta 90% | primeros semestres; excepto Medicina/Odontología |
| Beca Hospital UN | 20% | solo Enfermería; abierta (cierre 15-jun) |
| Beca Karl C. Parrish | hasta 80% | proyectos comunitarios / emprendimiento escolar |
| Beca Excelencia Deportiva | hasta 80% | ranking departamental / torneos nacionales |
| Beca Profesor Alberto Assa | 50% | solo Lic. Educación Infantil; 16-25 años; abierta |
| Beca Comedal | — | — |

- Convocatoria Becas Posgrado: https://www.uninorte.edu.co/web/apoyo-financiero/becas-posgrado
- Postulación vía plataforma Sabrina (convocatoria general, el Comité de Becas asigna).
- Diagnóstico: el spider no llegó a la subsección becas del menú "Becas, apoyo financiero y pagos".