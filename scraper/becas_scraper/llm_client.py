"""
Cliente LLM para extracción estructurada de becas.
Soporta: gemini | glm | deepseek | nvidia
Proveedor controlado por LLM_PROVIDER en .env

Reglas de extracción:
- Si el texto no contiene becas aplicables, devolver lista vacía.
- Nunca inventar fechas, requisitos ni URLs ausentes en el texto fuente.
- Las fechas se extraen como texto literal, nunca como booleano.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt del sistema — igual para todos los proveedores
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """Eres un extractor de becas universitarias colombianas.
A partir del texto de una página web universitaria, extrae ÚNICAMENTE las becas que encuentres.

Reglas ESTRICTAS:
1. Si no hay becas en el texto, devuelve: {"becas": []}
2. NUNCA inventes datos. Si un campo no está en el texto, usa null.
3. Las fechas deben ser texto literal del documento (ej. "15 de marzo de 2025"), nunca inventes.
4. coverage debe ser "TOTAL" o "PARCIAL" según lo que diga el texto. Si no está claro, usa "PARCIAL".
5. type debe ser "NACIONAL" siempre (este módulo solo trata becas colombianas para estudiantes colombianos).
6. requirements es una lista de objetos {type, label, value}. Solo incluye los mencionados explícitamente.
   - type válidos: SABER11_MIN, GPA_MIN, LANGUAGE, SISBEN, STRATUM, OTHER
   - value SIEMPRE debe ser un objeto JSON (nunca un string plano). Si el requisito es descriptivo
     (ej. "debe residir en cierta ciudad"), usa: {"text": "debe residir en Medellín"}.
     Ejemplo correcto:  {"type": "OTHER", "label": "Residencia", "value": {"text": "debe residir en Medellín"}}
     Ejemplo incorrecto: {"type": "OTHER", "label": "Residencia", "value": "debe residir en Medellín"}
     Para requisitos numéricos usa {"min_score": 350}; para idiomas {"language": "EN", "level": "B2"}.
7. source_name es el nombre del sitio/universidad, NO una URL.

Formato de salida (JSON puro, sin markdown):
{
  "becas": [
    {
      "title": "Nombre de la beca",
      "type": "NACIONAL",
      "coverage": "TOTAL" | "PARCIAL",
      "description": "descripción breve o null",
      "official_url": "URL exacta del texto o null",
      "application_url": "URL de inscripción o null",
      "opening_date": "texto de fecha apertura o null",
      "closing_date": "texto de fecha cierre o null",
      "provider_name": "nombre de la entidad que otorga o null",
      "requirements": [],
      "source_name": "nombre del sitio"
    }
  ]
}"""

USER_TEMPLATE = """Extrae las becas del siguiente texto de la universidad "{university_name}" (ciudad: {city}).

URL de origen: {source_url}

---TEXTO---
{text}
---FIN---

Recuerda: devuelve SOLO JSON válido, sin explicaciones ni markdown."""


# ---------------------------------------------------------------------------
# Adaptadores por proveedor
# ---------------------------------------------------------------------------

def _call_openai_compat(
    api_key: str,
    base_url: str,
    model: str,
    messages: list[dict],
    timeout: int = 90,
) -> str:
    """Llama a cualquier API compatible con el formato de mensajes de OpenAI."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.0,
        "response_format": {"type": "json_object"},
    }

    max_retries = 4
    for attempt in range(max_retries):
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(f"{base_url}/chat/completions", json=payload, headers=headers)
            if resp.status_code == 429:
                wait_time = (2 ** attempt) * 3
                logger.warning(
                    "[OpenAI-compat] 429 Rate Limit en %s. Reintentando en %ds (intento %d/%d)...",
                    base_url, wait_time, attempt + 1, max_retries
                )
                time.sleep(wait_time)
                continue
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    raise httpx.HTTPStatusError("429 Too Many Requests tras varios reintentos", request=None, response=resp)


def _call_gemini(api_key: str, model: str, prompt_text: str, timeout: int = 90) -> str:
    """Llama a la API REST de Gemini (generateContent) con reintentos para 429."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
        },
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
    }
    
    max_retries = 4
    for attempt in range(max_retries):
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 429:
                wait_time = (2 ** attempt) * 3
                logger.warning(
                    "[Gemini] 429 Rate Limit. Reintentando en %ds (intento %d/%d)...",
                    wait_time, attempt + 1, max_retries
                )
                time.sleep(wait_time)
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
            
    raise httpx.HTTPStatusError("429 Too Many Requests tras varios reintentos", request=None, response=resp)


# ---------------------------------------------------------------------------
# Función pública principal
# ---------------------------------------------------------------------------

def extract_scholarships(
    text: str,
    university_name: str,
    city: str,
    source_url: str,
    provider: str | None = None,
) -> list[dict[str, Any]]:
    """
    Extrae becas del texto usando el LLM configurado.

    Args:
        text: Texto plano de la página de becas.
        university_name: Nombre de la universidad (para contexto en el prompt).
        city: Ciudad de la universidad.
        source_url: URL de donde vino el texto.
        provider: 'gemini' | 'glm' | 'deepseek' | 'nvidia' (default: LLM_PROVIDER env).

    Returns:
        Lista de dicts que coinciden con ScholarshipItem (sin validar).
        Lista vacía si no hay becas o si el LLM lo indica así.

    Raises:
        ValueError: Si el proveedor no está configurado o la clave falta.
        httpx.HTTPError: Si la llamada al LLM falla (para manejo de reintentos).
    """
    provider = (provider or os.environ.get("LLM_PROVIDER", "gemini")).lower().strip()

    user_message = USER_TEMPLATE.format(
        university_name=university_name,
        city=city,
        source_url=source_url,
        text=text[:12000],  # Límite de contexto prudente
    )

    logger.info("[LLM] Proveedor=%s | Universidad=%s", provider, university_name)

    try:
        raw: str = _dispatch(provider, user_message)
        result = json.loads(raw)
        becas: list[dict] = result.get("becas", [])
        logger.info("[LLM] Becas extraídas: %d para %s", len(becas), university_name)
        return becas
    except json.JSONDecodeError as exc:
        logger.error("[LLM] JSON inválido del modelo: %s", exc)
        return []
    except Exception as exc:
        logger.error("[LLM] Error llamando al proveedor %s: %s", provider, exc)
        raise


def _dispatch(provider: str, user_message: str) -> str:
    """Selecciona el adaptador correcto según el proveedor."""
    if provider == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY no está configurada en .env")
        model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        # Gemini recibe system + user como un único prompt concatenado
        full_prompt = f"{user_message}"
        return _call_gemini(api_key, model, full_prompt)

    elif provider == "glm":
        api_key = os.environ.get("GLM_API_KEY", "")
        if not api_key:
            raise ValueError("GLM_API_KEY no está configurada en .env")
        model = os.environ.get("GLM_MODEL", "glm-4-flash")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        return _call_openai_compat(
            api_key=api_key,
            base_url="https://open.bigmodel.cn/api/paas/v4",
            model=model,
            messages=messages,
        )

    elif provider == "deepseek":
        api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY no está configurada en .env")
        model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        return _call_openai_compat(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1",
            model=model,
            messages=messages,
        )

    elif provider == "nvidia":
        api_key = os.environ.get("NVIDIA_API_KEY", "")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY no está configurada en .env")
        model = os.environ.get("NVIDIA_MODEL", "z-ai/glm-5.2")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        return _call_openai_compat(
            api_key=api_key,
            base_url="https://integrate.api.nvidia.com/v1",
            model=model,
            messages=messages,
        )

    else:
        raise ValueError(
            f"LLM_PROVIDER '{provider}' no reconocido. "
            "Valores válidos: gemini | glm | deepseek | nvidia"
        )
