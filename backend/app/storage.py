"""
In-memory storage for projects with persisted normalized catalog snapshot.
"""
import json
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


class InMemoryStorage:
    def __init__(self):
        self.projects: Dict[str, Project] = {}
        self.templates: Dict[str, Template] = {}
        self.rules: Dict[str, Rule] = {}
        self.normalized_catalog: NormalizedCatalogResponse | None = None
        self._init_defaults()

    def _init_defaults(self):
        for template in DEFAULT_TEMPLATES:
            self.templates[template.id] = template

        for rule in DEFAULT_RULES:
            self.rules[rule.id] = rule

        self.normalized_catalog = self._load_catalog_from_disk()
        if not self.normalized_catalog:
            self.normalized_catalog = build_normalized_catalog(EQUIPMENT_CATALOG)
            self._save_catalog_to_disk(self.normalized_catalog)

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
            self._save_catalog_to_disk(self.normalized_catalog)
        return self.normalized_catalog

    def refresh_normalized_catalog(self) -> NormalizedCatalogResponse:
        self.normalized_catalog = build_normalized_catalog(EQUIPMENT_CATALOG)
        self._save_catalog_to_disk(self.normalized_catalog)
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
        self._save_catalog_to_disk(catalog)
        return item

    def delete_equipment_type(self, type_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.equipment_types)
        catalog.equipment_types = [item for item in catalog.equipment_types if item.key != type_key]
        if len(catalog.equipment_types) == before:
            return False
        self._save_catalog_to_disk(catalog)
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
        self._save_catalog_to_disk(catalog)
        return item

    def delete_equipment_model(self, model_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.equipment_models)
        catalog.equipment_models = [item for item in catalog.equipment_models if item.key != model_key]
        if len(catalog.equipment_models) == before:
            return False
        self._save_catalog_to_disk(catalog)
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
        self._save_catalog_to_disk(catalog)
        return item

    def delete_compatibility_rule(self, rule_key: str) -> bool:
        catalog = self._touch_catalog()
        before = len(catalog.compatibility_rules)
        catalog.compatibility_rules = [
            item for item in catalog.compatibility_rules if item.rule_key != rule_key
        ]
        if len(catalog.compatibility_rules) == before:
            return False
        self._save_catalog_to_disk(catalog)
        return True


storage = InMemoryStorage()
