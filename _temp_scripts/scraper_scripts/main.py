"""
Punto de entrada de orquestación del scraper (Fase H del plan).

Uso directo (equivalente a scrapy crawl):
    python main.py                      # procesa todas las pendientes
    python main.py --limit 10           # solo las primeras 10 (Etapa 1 del rollout)
    python main.py --ids 1,5,12         # solo esas universidades
    python main.py --report             # solo imprime el estado actual del checkpoint

Modo scheduler (APScheduler):
    python main.py --schedule --interval 360   # corre cada 6 horas

Nota del plan §H:
    La automatización es DENTRO de cada etapa de rollout.
    El avance de etapa 1→2→3 siempre requiere aprobación humana.
    Este script NUNCA avanza de etapa solo.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Configurar logging antes de cualquier import de scrapy
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("becas_scraper.main")

CHECKPOINT_PATH = Path(__file__).parent / "scraper_checkpoint.db"


def run_spider(limit: int = 0, ids: str = "") -> None:
    """Ejecuta el spider de Scrapy en proceso."""
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings

    settings = get_project_settings()
    process = CrawlerProcess(settings)

    kwargs: dict = {}
    if limit:
        kwargs["limit"] = str(limit)
    if ids:
        kwargs["ids"] = ids

    process.crawl("becas_spider", **kwargs)
    process.start()


def print_report() -> None:
    """Imprime el estado actual del checkpoint."""
    from becas_scraper.checkpoint import CheckpointDB

    db = CheckpointDB(CHECKPOINT_PATH)
    summary = db.get_summary()
    total = sum(summary.values())

    print("\n" + "=" * 50)
    print("REPORTE DE CHECKPOINT — Becas Colombia Scraper")
    print("=" * 50)

    if not summary:
        print("  Checkpoint vacío — no se ha procesado nada aún.")
    else:
        for status, count in sorted(summary.items()):
            pct = (count / total * 100) if total else 0
            bar = "#" * int(pct / 5)
            print(f"  {status:<22} {count:>4}  {bar} {pct:.1f}%")
        print(f"\n  Total registros: {total}")

        # Desglose por método de descubrimiento (universidades con URL encontrada)
        with db._conn() as conn:
            rows = conn.execute(
                """
                SELECT metodo_descubrimiento, COUNT(*) as cnt
                FROM checkpoint
                WHERE metodo_descubrimiento IS NOT NULL
                GROUP BY metodo_descubrimiento
                ORDER BY cnt DESC
                """
            ).fetchall()
        if rows:
            print("\n  Método de descubrimiento de URL (universidades procesadas):")
            for r in rows:
                print(f"    {r['metodo_descubrimiento']:<20} {r['cnt']:>4}")

    print("=" * 50 + "\n")


def run_scheduler(interval_minutes: int) -> None:
    """
    Corre el spider en intervalos con APScheduler.
    Cada corrida procesa solo las universidades pendientes.
    """
    from apscheduler.schedulers.blocking import BlockingScheduler

    scheduler = BlockingScheduler()

    def job() -> None:
        logger.info("[Scheduler] Iniciando corrida programada...")
        run_spider()
        print_report()
        logger.info("[Scheduler] Corrida completada. Próxima en %d minutos.", interval_minutes)

    scheduler.add_job(job, "interval", minutes=interval_minutes, id="becas_job")
    logger.info("[Scheduler] Programado cada %d minutos. Ctrl+C para detener.", interval_minutes)

    # Primera corrida inmediata
    job()
    scheduler.start()


def main() -> None:
    parser = argparse.ArgumentParser(description="Scraper de Becas Colombia")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Número máximo de universidades a procesar (0 = todas las pendientes)",
    )
    parser.add_argument(
        "--ids",
        type=str,
        default="",
        help="IDs específicas de universidades separadas por coma (ej: 1,5,12)",
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Solo muestra el estado actual del checkpoint sin correr el spider",
    )
    parser.add_argument(
        "--schedule",
        action="store_true",
        help="Modo scheduler: corre el spider periódicamente",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=360,
        help="Intervalo en minutos para el modo scheduler (default: 360 = 6h)",
    )
    args = parser.parse_args()

    if args.report:
        print_report()
        return

    if args.schedule:
        run_scheduler(args.interval)
        return

    logger.info("[Main] Iniciando scraper...")
    if args.limit:
        logger.info("[Main] Modo piloto: máximo %d universidades", args.limit)
    if args.ids:
        logger.info("[Main] Modo IDs específicas: %s", args.ids)

    run_spider(limit=args.limit, ids=args.ids)
    print_report()
    logger.info("[Main] Proceso completado.")


if __name__ == "__main__":
    main()
