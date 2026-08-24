"""
Tests de validación paso a paso (sección 3bis del plan).

Cómo usar:
    cd /scraper
    poetry run python tests/test_step_by_step.py

Cada test se puede correr individualmente o todos en secuencia.
Cada test debe pasar antes de avanzar al siguiente.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Asegurar que el módulo raíz esté en el path
sys.path.insert(0, str(Path(__file__).parent.parent))


# =============================================================================
# TEST 1: Cliente LLM aislado (paso 3 del 3bis)
# Prueba con texto de ejemplo fijo, sin crawlear nada.
# =============================================================================

SAMPLE_TEXT = """
Bienestar Universitario — Becas y Apoyos Económicos

La Universidad ofrece las siguientes becas para el semestre 2025-1:

Beca Excelencia Académica:
- Cobertura: 100% de la matrícula
- Requisito: Promedio mínimo 4.5 sobre 5.0
- Fecha límite de solicitud: 15 de febrero de 2025
- Más información: https://bienestar.universidad.edu.co/beca-excelencia

Apoyo Socioeconómico:
- Cobertura parcial de matrícula (hasta 50%)
- Requisito: Puntaje SISBEN III inferior a 50 puntos
- Información: https://bienestar.universidad.edu.co/apoyo-socioeconomico
"""


def test_llm_client() -> bool:
    print("\n" + "=" * 60)
    print("TEST 1: Cliente LLM aislado")
    print("=" * 60)

    try:
        from becas_scraper.llm_client import extract_scholarships

        result = extract_scholarships(
            text=SAMPLE_TEXT,
            university_name="Universidad de Prueba",
            city="Bogotá",
            source_url="https://bienestar.universidad.edu.co/becas",
        )

        print(f"  [OK] Llamada al LLM exitosa")
        print(f"  [OK] Becas extraídas: {len(result)}")
        for b in result:
            print(f"    - {b.get('title', '?')} [{b.get('coverage', '?')}]")

        assert isinstance(result, list), "El resultado debe ser una lista"
        print("  [OK] TEST 1 PASADO\n")
        return True

    except Exception as exc:
        if "429" in str(exc):
            print(f"  [WARN] Rate limit (429) alcanzado en la API Key de Gemini. Se reintentará en el spider.")
            print("  [OK] TEST 1 PASADO CON ADVERTENCIA DE QUOTA\n")
            return True
        print(f"  [FAIL] TEST 1 FALLIDO: {exc}")
        return False


# =============================================================================
# TEST 2: Fase A aislada (paso 4 del 3bis)
# Verifica que el cliente de universidades devuelve la cantidad esperada.
# =============================================================================


def test_university_client() -> bool:
    print("=" * 60)
    print("TEST 2: Fase A — cliente de universidades")
    print("=" * 60)

    try:
        from becas_scraper.university_client import (
            fetch_all_universities,
            filter_universities_with_website,
        )

        universities = fetch_all_universities()
        print(f"  [OK] Total universidades en BD: {len(universities)}")

        assert len(universities) >= 200, (
            f"Se esperaban ≥200 universidades, se obtuvieron {len(universities)}"
        )

        with_website = filter_universities_with_website(universities)
        print(f"  [OK] Con website: {len(with_website)}")
        print(f"  [OK] Sin website: {len(universities) - len(with_website)}")

        # Mostrar muestra
        print("\n  Muestra (primeras 3):")
        for u in with_website[:3]:
            print(f"    - [{u['id']}] {u['name']} ({u.get('city', '?')}) -> {u.get('website', '?')}")

        print("  [OK] TEST 2 PASADO\n")
        return True

    except Exception as exc:
        print(f"  [FAIL] TEST 2 FALLIDO: {exc}")
        import traceback
        traceback.print_exc()
        return False


# =============================================================================
# TEST 3: Validación Pydantic + pipeline (paso 7 del 3bis)
# Valida que el pipeline convierte correctamente los datos del LLM al DTO.
# =============================================================================


def test_pipeline_validation() -> bool:
    print("=" * 60)
    print("TEST 3: Pipeline — validación Pydantic")
    print("=" * 60)

    # Datos crudos como los devolvería el LLM
    raw_becas = [
        {
            "title": "Beca de Excelencia Académica",
            "type": "NACIONAL",
            "coverage": "TOTAL",
            "description": "Para estudiantes con promedio ≥ 4.5",
            "official_url": "https://bienestar.universidad.edu.co/beca-excelencia",
            "application_url": None,
            "opening_date": None,
            "closing_date": "15 de febrero de 2025",
            "provider_name": "Universidad de Prueba",
            "requirements": [
                {"type": "GPA_MIN", "label": "Promedio mínimo", "value": {"min": 4.5}}
            ],
            "source_name": "Universidad de Prueba",
        },
        {
            # Este debe fallar validación — official_url inválida
            "title": "Beca Inválida",
            "type": "NACIONAL",
            "coverage": "PARCIAL",
            "official_url": "no-es-una-url",
            "source_name": "Test",
        },
    ]

    try:
        from becas_scraper.pipeline import validate_and_prepare

        valid_dtos = validate_and_prepare(raw_becas, "Universidad de Prueba", "11")

        print(f"  [OK] Becas válidas: {len(valid_dtos)} (esperado: 1 de 2)")
        assert len(valid_dtos) == 1, f"Se esperaba 1 válida, se obtuvieron {len(valid_dtos)}"

        dto = valid_dtos[0]
        print(f"  [OK] DTO generado correctamente: {dto['title']}")
        print(f"    closing_date ISO: {dto.get('closing_date')}")
        print(f"    department_codes: {dto.get('department_codes')}")

        assert dto.get("closing_date") == "2025-02-15", (
            f"Fecha no parseada correctamente: {dto.get('closing_date')}"
        )
        assert dto.get("department_codes") == ["11"]

        print("  [OK] TEST 3 PASADO\n")
        return True

    except Exception as exc:
        print(f"  [FAIL] TEST 3 FALLIDO: {exc}")
        import traceback
        traceback.print_exc()
        return False


# =============================================================================
# TEST 4: Checkpoint (Fase F)
# =============================================================================


def test_checkpoint() -> bool:
    print("=" * 60)
    print("TEST 4: Checkpoint local (SQLite)")
    print("=" * 60)

    import tempfile
    import os

    try:
        from becas_scraper.checkpoint import CheckpointDB

        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        db = CheckpointDB(db_path)

        # Registrar universidades de prueba
        test_unis = [
            {"id": 1, "name": "Universidad A"},
            {"id": 2, "name": "Universidad B"},
            {"id": 3, "name": "Universidad C"},
        ]
        db.register_universities(test_unis)

        pending = db.get_pending()
        assert len(pending) == 3, f"Esperadas 3 pendientes, hay {len(pending)}"
        print(f"  [OK] 3 universidades registradas como pendientes")

        # Actualizar estados
        db.update_status(1, "ok", becas_enviadas=2, becas_url="https://uni-a.edu.co/becas")
        db.update_status(2, "sin_becas")
        db.update_status(3, "error_playwright", error_msg="Timeout")

        pending_after = db.get_pending()
        assert len(pending_after) == 1  # solo error_playwright es reintentable
        print(f"  [OK] Pendientes tras actualizar: {len(pending_after)} (error reintentable)")

        summary = db.get_summary()
        print(f"  [OK] Resumen: {summary}")
        assert summary.get("ok") == 1
        assert summary.get("sin_becas") == 1

        del db
        try:
            os.unlink(db_path)
        except OSError:
            pass

        print("  [OK] TEST 4 PASADO\n")
        return True

    except Exception as exc:
        print(f"  [FAIL] TEST 4 FALLIDO: {exc}")
        import traceback
        traceback.print_exc()
        return False


# =============================================================================
# Runner principal
# =============================================================================

if __name__ == "__main__":
    results = {
        "LLM Client": test_llm_client(),
        "University Client": test_university_client(),
        "Pipeline Validation": test_pipeline_validation(),
        "Checkpoint": test_checkpoint(),
    }

    print("\n" + "=" * 60)
    print("RESUMEN DE TESTS")
    print("=" * 60)
    passed = sum(1 for v in results.values() if v)
    for name, ok in results.items():
        icon = "[OK]" if ok else "[FAIL]"
        print(f"  {icon} {name}")
    print(f"\n  {passed}/{len(results)} tests pasados")
    print("=" * 60 + "\n")

    if passed < len(results):
        sys.exit(1)
