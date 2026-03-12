"""
Import helpers for equipment catalog enrichment from vendor product pages.
"""
import re
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import requests
from bs4 import BeautifulSoup

from app.catalog_schema import CatalogPortDefinition, EquipmentModelDefinition
from app.version import CATALOG_SCHEMA_VERSION


MODEL_PATTERN = re.compile(r"\b([A-Z0-9]{2,8}-[A-Z0-9\-]{3,})\b")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"model-{uuid4().hex[:8]}"


def _extract_model_code(url: str, title: str, text_blob: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    query_candidates = []
    for entry in query.get("subName", []) + query.get("model", []):
        query_candidates.extend(MODEL_PATTERN.findall(entry.upper()))

    all_candidates = query_candidates + MODEL_PATTERN.findall(title.upper()) + MODEL_PATTERN.findall(
        text_blob.upper()
    )
    if not all_candidates:
        return _slugify(title).upper()

    # Prefer model codes that contain digits and are the longest.
    ranked = sorted(
        set(all_candidates),
        key=lambda item: (any(ch.isdigit() for ch in item), len(item)),
        reverse=True,
    )
    return ranked[0]


def _build_display_name(title: str, model: str) -> str:
    upper_title = title.upper()
    if f"{model} NEW" in upper_title or ("NEW" in upper_title and model in upper_title):
        return f"{model} NEW"
    return model


def _extract_ethernet_count(text_blob: str) -> int:
    lowered = text_blob.lower()
    patterns = [
        r"\b(\d{1,2})\s*(?:x|×)?\s*rj-?45\b",
        r"\b(\d{1,2})\s*(?:x|×)?\s*ethernet\b",
        r"\b(\d{1,2})\s*(?:x|×)?\s*network interface\b",
        r"\b(\d{1,2})\s*(?:x|×)?\s*lan\b",
    ]
    counts: list[int] = []
    for pattern in patterns:
        for match in re.finditer(pattern, lowered):
            counts.append(int(match.group(1)))

    if counts:
        # Keep a realistic cap to avoid false positives from unrelated numeric specs.
        return max(1, min(max(counts), 8))

    if any(word in lowered for word in ["rj45", "rj-45", "ethernet", "network interface", "lan"]):
        return 1

    return 0


def _extract_ports(text_blob: str) -> list[CatalogPortDefinition]:
    lowered = text_blob.lower()
    ports: list[CatalogPortDefinition] = []
    used_names: set[str] = set()

    def add_port(
        name: str,
        port_type: str,
        speed_mbps: int | None = None,
        power_watts: float | None = None,
    ) -> None:
        if name in used_names:
            return
        used_names.add(name)
        ports.append(
            CatalogPortDefinition(
                name=name,
                port_type=port_type,
                speed_mbps=speed_mbps,
                power_watts=power_watts,
            )
        )

    ethernet_count = _extract_ethernet_count(lowered)

    if "10/100/1000" in lowered or "gigabit" in lowered or "1000m" in lowered:
        eth_speed = 1000
    elif "10/100" in lowered:
        eth_speed = 100
    else:
        eth_speed = 1000

    for index in range(ethernet_count or 1):
        add_port(f"ETH{index + 1}", "ethernet", speed_mbps=eth_speed)

    if "poe" in lowered:
        add_port("POE", "power")

    if any(token in lowered for token in ["power", "12v", "24v", "dc", "ac"]):
        add_port("PWR", "power")

    if "rs-485" in lowered:
        add_port("RS-485", "serial")
    if "alarm in" in lowered:
        add_port("ALARM_IN", "serial")
    if "alarm out" in lowered:
        add_port("ALARM_OUT", "serial")
    if "audio in" in lowered:
        add_port("AUDIO_IN", "serial")
    if "audio out" in lowered:
        add_port("AUDIO_OUT", "serial")

    return ports


def import_hikvision_model_from_url(
    url: str,
    *,
    type_key: str = "camera",
    lifecycle_status: str = "verified",
    timeout_seconds: int = 20,
) -> EquipmentModelDefinition:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=timeout_seconds)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    title_tag = soup.find("h1")
    title = title_tag.get_text(strip=True) if title_tag else "Imported Hikvision Model"
    og_title = soup.find("meta", attrs={"property": "og:title"})
    if og_title and og_title.get("content"):
        title = og_title.get("content").strip()

    text_blob = soup.get_text(" ", strip=True)
    model = _extract_model_code(url, title, text_blob)
    display_name = _build_display_name(title, model)

    key = _slugify(model)

    ports = _extract_ports(text_blob)

    return EquipmentModelDefinition(
        id=str(uuid4()),
        key=key,
        type_key=type_key,
        name=display_name,
        manufacturer="Hikvision",
        model=model,
        lifecycle_status=lifecycle_status,
        schema_version=CATALOG_SCHEMA_VERSION,
        ports=ports,
    )
