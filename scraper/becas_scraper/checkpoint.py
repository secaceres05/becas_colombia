"""
Checkpoint local del scraper.
Registra el estado de procesamiento de cada universidad en SQLite.
No toca la base de datos PostgreSQL de producción.

Estados posibles:
  pendiente        → aún no procesada
  ok               → procesada sin errores
  error_playwright → fallo de navegación/JS
  error_pdf        → PDF no pudo ser extraído
  error_llm        → fallo del proveedor LLM (rate limit, red, etc.)
  error_permanente → fallo de red/dominio no recuperable (no se reintenta)
  sin_url_becas    → no se encontró página de becas en el sitio
  sin_becas        → se procesó pero el LLM no encontró becas
  baja_confianza   → se procesó pero con señales de baja calidad
  login_requerido  → contenido detrás de paywall/login
"""

from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

StatusType = Literal[
    "pendiente",
    "ok",
    "error_playwright",
    "error_pdf",
    "error_llm",
    "error_permanente",
    "sin_url_becas",
    "sin_becas",
    "baja_confianza",
    "login_requerido",
]

_DDL = """
CREATE TABLE IF NOT EXISTS checkpoint (
    university_id        INTEGER PRIMARY KEY,
    university_name      TEXT    NOT NULL,
    status               TEXT    NOT NULL DEFAULT 'pendiente',
    becas_enviadas       INTEGER NOT NULL DEFAULT 0,
    becas_url            TEXT,
    error_msg            TEXT,
    metodo_descubrimiento TEXT,
    updated_at           TEXT    NOT NULL
);
"""

# Migración para DBs existentes: agrega la columna si no existe
_MIGRATION_METODO = """
ALTER TABLE checkpoint ADD COLUMN metodo_descubrimiento TEXT;
"""


class CheckpointDB:
    """Checkpoint local thread-safe basado en SQLite."""

    def __init__(self, db_path: str | Path = "scraper_checkpoint.db") -> None:
        self.db_path = Path(db_path)
        self._lock = threading.Lock()
        self._init()

    def _init(self) -> None:
        with self._conn() as conn:
            conn.executescript(_DDL)
            # Migración: agregar columna metodo_descubrimiento si no existe
            try:
                conn.executescript(_MIGRATION_METODO)
            except sqlite3.OperationalError:
                pass  # La columna ya existe

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    # ------------------------------------------------------------------
    # Escritura
    # ------------------------------------------------------------------

    def register_universities(self, universities: list[dict]) -> None:
        """
        Inserta universidades en estado 'pendiente' si no existen ya.
        No sobreescribe registros existentes (para no perder progreso).
        """
        with self._lock, self._conn() as conn:
            conn.executemany(
                """
                INSERT OR IGNORE INTO checkpoint
                    (university_id, university_name, status, updated_at)
                VALUES (?, ?, 'pendiente', ?)
                """,
                [
                    (u["id"], u["name"], self._now())
                    for u in universities
                ],
            )

    def update_status(
        self,
        university_id: int,
        status: StatusType,
        *,
        becas_enviadas: int = 0,
        becas_url: str | None = None,
        error_msg: str | None = None,
        metodo_descubrimiento: str | None = None,
    ) -> None:
        """Actualiza el estado de una universidad en tiempo real.

        Args:
            metodo_descubrimiento: cómo se encontró la URL de becas.
                Valores: "home", "sitemap_directo", "sitemap_robots", None (sin_url/error).
        """
        with self._lock, self._conn() as conn:
            conn.execute(
                """
                UPDATE checkpoint
                SET status                  = ?,
                    becas_enviadas           = ?,
                    becas_url                 = ?,
                    error_msg                 = ?,
                    metodo_descubrimiento      = COALESCE(?, metodo_descubrimiento),
                    updated_at                = ?
                WHERE university_id = ?
                """,
                (status, becas_enviadas, becas_url, error_msg,
                 metodo_descubrimiento, self._now(), university_id),
            )

    # ------------------------------------------------------------------
    # Lectura
    # ------------------------------------------------------------------

    def get_pending(self, retry_errors: bool = True) -> list[dict]:
        """
        Devuelve universidades en estado 'pendiente'.
        Si retry_errors=True, incluye también las que tienen errores
        transitorios (error_playwright, error_pdf).
        """
        retry_statuses = ("pendiente",)
        if retry_errors:
            retry_statuses = ("pendiente", "error_playwright", "error_pdf", "error_llm")

        placeholders = ",".join("?" * len(retry_statuses))
        with self._conn() as conn:
            rows = conn.execute(
                f"SELECT * FROM checkpoint WHERE status IN ({placeholders})",
                retry_statuses,
            ).fetchall()
        return [dict(r) for r in rows]

    def get_summary(self) -> dict[str, int]:
        """Devuelve conteo por estado para el reporte de sesión."""
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT status, COUNT(*) as cnt FROM checkpoint GROUP BY status"
            ).fetchall()
        return {r["status"]: r["cnt"] for r in rows}

    def count_by_status(self, status: StatusType) -> int:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT COUNT(*) FROM checkpoint WHERE status = ?", (status,)
            ).fetchone()
        return row[0]

    def is_done(self) -> bool:
        """True si no quedan universidades pendientes (ni errores reintentables)."""
        return len(self.get_pending()) == 0

    def get_all(self) -> list[dict]:
        with self._conn() as conn:
            rows = conn.execute("SELECT * FROM checkpoint ORDER BY university_id").fetchall()
        return [dict(r) for r in rows]

    def close(self) -> None:
        """Cierra el pool/recursos si aplica."""
        pass
