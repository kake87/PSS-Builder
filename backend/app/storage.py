"""
Хранилище проектов в памяти
"""
from typing import Dict, List
from app.models import Project, Template, Device, Rule
from app.models.template import DEFAULT_TEMPLATES
from app.models.rule import DEFAULT_RULES


class InMemoryStorage:
    def __init__(self):
        self.projects: Dict[str, Project] = {}
        self.templates: Dict[str, Template] = {}
        self.rules: Dict[str, Rule] = {}
        self._init_defaults()

    def _init_defaults(self):
        """Инициализировать встроенные шаблоны и правила"""
        for template in DEFAULT_TEMPLATES:
            self.templates[template.id] = template
        
        for rule in DEFAULT_RULES:
            self.rules[rule.id] = rule

    # Проекты
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

    # Шаблоны
    def get_template(self, template_id: str) -> Template | None:
        return self.templates.get(template_id)

    def list_templates(self) -> List[Template]:
        return list(self.templates.values())

    # Правила
    def get_rule(self, rule_id: str) -> Rule | None:
        return self.rules.get(rule_id)

    def list_rules(self) -> List[Rule]:
        return list(self.rules.values())


# Глобальный экземпляр хранилища
storage = InMemoryStorage()
