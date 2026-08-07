"""
Contrato de datos normalizado entre el scraper y el backend.
Todo spider debe producir un ScholarshipItem antes de enviarlo a /ingest.
"""
from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class ScholarshipType(str, Enum):
    NACIONAL = "NACIONAL"
    INTERNACIONAL = "INTERNACIONAL"


class Coverage(str, Enum):
    TOTAL = "TOTAL"
    PARCIAL = "PARCIAL"


class RequirementItem(BaseModel):
    type: str  # SABER11_MIN | GPA_MIN | LANGUAGE | SISBEN | STRATUM | OTHER
    label: str
    value: dict  # ej. {"min_score": 350} | {"language": "EN", "level": "B2"}


class ScholarshipItem(BaseModel):
    title: str
    type: ScholarshipType
    coverage: Coverage
    description: Optional[str] = None
    official_url: HttpUrl
    application_url: Optional[HttpUrl] = None
    opening_date: Optional[date] = None
    closing_date: Optional[date] = None
    provider_name: Optional[str] = None
    requirements: list[RequirementItem] = Field(default_factory=list)
    source_name: str  # nombre de la fuente (Source) que originó el dato
