"""
In-memory storage for projects with persisted normalized catalog snapshot.
"""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from app.catalog_schema import (
    CompatibilityRuleDefinition,
    EquipmentModelDefinition,
    EquipmentTypeDefinition,
    NormalizedCatalogResponse,
    build_normalized_catalog,
)
from app.equipment_catalog import EQUIPMENT_CATALOG
from app.models import Project, Rule, Template
from app.models.rule import DEFAULT_RULES
from app.models.template import DEFAULT_TEMPLATES


CATALOG_STORAGE_FILE = Path(__file__).resolve().parents[1] / "data" / "normalized_catalog.json"
CATALOG_DB_FILE = Path(__file__).resolve().parents[1] / "data" / "catalog.db"


class CatalogDatabase:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _ensure_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS catalog_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS equipment_types (
                    key TEXT PRIMARY KEY,
                    id TEXT NOT NULL,
                    lifecycle_status TEXT NOT NULL,
                    payload TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS equipment_models (
                    key TEXT PRIMARY KEY,
                    id TEXT NOT NULL,
                    type_key TEXT NOT NULL,
                    lifecycle_status TEXT NOT NULL,
                    updated_at TEXT,
                    payload TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS compatibility_rules (
                    rule_key TEXT PRIMARY KEY,
                    id TEXT NOT NULL,
                    lifecycle_status TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                """
            )

    def has_catalog_data(self) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM equipment_types) +
                    (SELECT COUNT(*) FROM equipment_models) +
                    (SELECT COUNT(*) FROM compatibility_rules) AS total_count
                """
            ).fetchone()
        return bool(row and row["total_count"])

    def load_catalog(self) -> NormalizedCatalogResponse | None:
        if not self.has_catalog_data():
            return None

        with self._connect() as connection:
            generated_at_row = connection.execute(
                "SELECT value FROM catalog_metadata WHERE key = ?",
                ("generated_at",),
            ).fetchone()

            equipment_types = [
                EquipmentTypeDefinition.model_validate_json(row["payload"])
                for row in connection.execute(
                    "SELECT payload FROM equipment_types ORDER BY key"
                ).fetchall()
            ]
            equipment_models = [
                EquipmentModelDefinition.model_validate_json(row["payload"])
                for row in connection.execute(
                    "SELECT payload FROM equipment_models ORDER BY key"
                ).fetchall()
            ]
            compatibility_rules = [
                CompatibilityRuleDefinition.model_validate_json(row["payload"])
                for row in connection.execute(
                    "SELECT payload FROM compatibility_rules ORDER BY rule_key"
                ).fetchall()
            ]

        return NormalizedCatalogResponse(
            generated_at=generated_at_row["value"]
            if generated_at_row
            else datetime.now(timezone.utc).isoformat(),
            equipment_types=equipment_types,
            equipment_models=equipment_models,
            compatibility_rules=compatibility_rules,
        )

    def save_catalog(self, catalog: NormalizedCatalogResponse) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM catalog_metadata")
            connection.execute("DELETE FROM equipment_types")
            connection.execute("DELETE FROM equipment_models")
            connection.execute("DELETE FROM compatibility_rules")

            connection.execute(
                "INSERT INTO catalog_metadata(key, value) VALUES (?, ?)",
                ("generated_at", catalog.generated_at),
            )
            connection.executemany(
                """
                INSERT INTO equipment_types(key, id, lifecycle_status, payload)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (
                        item.key,
                        item.id,
                        item.lifecycle_status,
                        item.model_dump_json(),
                    )
                    for item in catalog.equipment_types
                ],
            )
            connection.executemany(
                """
                INSERT INTO equipment_models(key, id, type_key, lifecycle_status, updated_at, payload)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        item.key,
                        item.id,
                        item.type_key,
                        item.lifecycle_status,
                        item.updated_at,
                        item.model_dump_json(),
                    )
                    for item in catalog.equipment_models
                ],
            )
            connection.executemany(
                """
                INSERT INTO compatibility_rules(rule_key, id, lifecycle_status, payload)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (
                        item.rule_key,
                        item.id,
                        item.lifecycle_status,
                        item.model_dump_json(),
                    )
                    for item in catalog.compatibility_rules
                ],
            )


class InMemoryStorage:
    def __init__(self):
        self.projects: Dict[str, Project] = {}
        self.templates: Dict[str, Template] = {}
        self.rules: Dict[str, Rule] = {}
        self.normalized_catalog: NormalizedCatalogResponse | None = None
        self.catalog_db = CatalogDatabase(CATALOG_DB_FILE)
        self._init_defaults()

    def _init_defaults(self):
        for template in DEFAULT_TEMPLATES:
            self.templates[template.id] = template

        for rule in DEFAULT_RULES:
            self.rules[rule.id] = rule

        self.normalized_catalog = self.catalog_db.load_catalog()
        if not self.normalized_catalog:
            self.normalized_catalog = self._load_catalog_from_disk()
        if not self.normalized_catalog:
            self.normalized_catalog = build_normalized_catalog(EQUIPMENT_CATALOG)
        self._persist_catalog(self.normalized_catalog)

    def _load_catalog_from_disk(self) -> NormalizedCatalogResponse | None:
        if not CATALOG_STORAGE_FILE.exists():
            return None
        try:
            payload = json.loads(CATALOG_STORAGE_FILE.read_text(encoding="utf-8"))
            return NormalizedCatalogResponse.model_validate(payload)
        except Exception as error:
            print(f"[Storage] Failed to load normalized catalog from disk: {error}")
            return None

    def _save_catalog_to_disk(self, catalog: NormalizedCatalogResponse) -> None:
        CATALOG_STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CATALOG_STORAGE_FILE.write_text(
            json.dumps(catalog.model_dump(mode="json"), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _persist_catalog(self, catalog: NormalizedCatalogResponse) -> None:
        self.catalog_db.save_catalog(catalog)
        self._save_catalog_to_disk(catalog)

    def _touch_catalog(self) -> NormalizedCatalogResponse:
        catalog = self.get_normalized_catalog()
        catalog.generated_at = datetime.now(timezone.utc).isoformat()
        return catalog

    # Projects
    def create_project(self, project: Project) -> Project:
        self.projects[project.id] = project
        return project

    def get_project(self, project_id: str) -> Project | None:
        return self.projects.get(project_id)

    def list_projects(self) -> List[Project]:
        return list(self.projects.values())

    def update_project(self, project_id: str, project: Project) -> Project:
        self.projects[project_id] = project
        return project

    def delete_project(self, project_id: str) -> bool:
        if project_id in self.projects:
            del self.projects[project_id]
            return True
        return False

    # Templates
    def get_template(self, template_id: str) -> Template | None:
        return self.templates.get(template_id)

    def list_templates(self) -> List[Template]:
        return list(self.templates.values())

    # Rules
    def get_rule(self, rule_id: str) -> Rule | None:
        return self.rules.get(rule_id)

    def list_rules(self) -> List[Rule]:
        return list(self.rules.values())

    # Normalized catalog
    def get_normalized_catalog(self) -> NormalizedCatalogResponse:
        if not self.normalized_catalog:
            self.normalized_catalog = build_normalized_catalog(EQUIPMENT_CATALOG)
            self._persist_catalog(self.normalized_catalog)
        return self.normalized_catalog

    def refresh_normalized_catalog(self) -> NormalizedCatalogResponse:
        self.normalized_catalog = build_normalized_catalog(EQUIPMENT_CATALOG)
        self._persist_catalog(self.normalized_catalog)
        return self.normalized_catalog

    def upsert_equipment_type(self, item: EquipmentTypeDefinition) -> EquipmentTypeDefinition:
        catalog = self._touch_catalog()
        existing_idx = next(
            (index for index, current in enumerate(catalog.equipment_types) if current.key == item.key),
            None,
        )
        if existing_idx is None:
            catalog.equipment_types.append(item)
        else:
            catalog.equipment_types[existing_idx] = item
        self._persist_catalog(catalog)
        return item

    def delete_equipment_type(self, type_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.equipment_types)
        catalog.equipment_types = [item for item in catalog.equipment_types if item.key != type_key]
        if len(catalog.equipment_types) == before:
            return False
        self._persist_catalog(catalog)
        return True

    def upsert_equipment_model(self, item: EquipmentModelDefinition) -> EquipmentModelDefinition:
        catalog = self._touch_catalog()
        existing_idx = next(
            (index for index, current in enumerate(catalog.equipment_models) if current.key == item.key),
            None,
        )
        if existing_idx is None:
            catalog.equipment_models.append(item)
        else:
            catalog.equipment_models[existing_idx] = item
        self._persist_catalog(catalog)
        return item

    def delete_equipment_model(self, model_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.equipment_models)
        catalog.equipment_models = [item for item in catalog.equipment_models if item.key != model_key]
        if len(catalog.equipment_models) == before:
            return False
        self._persist_catalog(catalog)
        return True

    def upsert_compatibility_rule(
        self, item: CompatibilityRuleDefinition
    ) -> CompatibilityRuleDefinition:
        catalog = self._touch_catalog()
        existing_idx = next(
            (
                index
                for index, current in enumerate(catalog.compatibility_rules)
                if current.rule_key == item.rule_key
            ),
            None,
        )
        if existing_idx is None:
            catalog.compatibility_rules.append(item)
        else:
            catalog.compatibility_rules[existing_idx] = item
        self._persist_catalog(catalog)
        return item

    def delete_compatibility_rule(self, rule_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.compatibility_rules)
        catalog.compatibility_rules = [
            item for item in catalog.compatibility_rules if item.rule_key != rule_key
        ]
        if len(catalog.compatibility_rules) == before:
            return False
        self._persist_catalog(catalog)
        return True


storage = InMemoryStorage()
