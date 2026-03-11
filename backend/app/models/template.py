from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import uuid4
from .device import Device
from .link import Link


class Template(BaseModel):
    """Шаблон решения для быстрой сборки архитектуры"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Название шаблона")
    description: str = Field("", description="Описание шаблона решения")
    category: str = Field(..., description="Категория (склад, офис, магазин, производство)")
    
    # Описание решения
    solution_description: str = Field("", description="Подробное описание решения")
    
    # Прототип устройств и соединений
    device_templates: List[Dict[str, Any]] = Field(default_factory=list, description="Шаблоны устройств")
    link_templates: List[Dict[str, Any]] = Field(default_factory=list, description="Шаблоны соединений")
    
    # Требования
    requirements: Dict[str, Any] = Field(default_factory=dict, description="Требования по умолчанию")
    
    class Config:
        use_enum_values = True


# Встроенные шаблоны решений
DEFAULT_TEMPLATES = [
    Template(
        name="Малый офис",
        description="Система видеонаблюдения для офиса 4-6 камер",
        category="офис",
        solution_description="Компактная система видеонаблюдения с локальным хранилищем",
        requirements={
            "cameras": 6,
            "storage_days": 14,
            "resolution": "1080p",
            "type": "wired"
        }
    ),
    Template(
        name="Средний склад",
        description="Система видеонаблюдения с СКУД для склада 15-20 камер",
        category="склад",
        solution_description="Система с видеонаблюдением, контролем доступа и управлением складом",
        requirements={
            "cameras": 20,
            "storage_days": 30,
            "resolution": "2K",
            "access_control": True,
            "type": "mixed"
        }
    ),
    Template(
        name="Крупный розничный магазин",
        description="Комплексная система видеонаблюдения, СКУД и счётчиков посетителей",
        category="магазин",
        solution_description="Полнофункциональная система для розничного магазина",
        requirements={
            "cameras": 40,
            "storage_days": 60,
            "resolution": "4K",
            "access_control": True,
            "people_counting": True,
            "type": "professional"
        }
    ),
    Template(
        name="Производственное предприятие",
        description="Система видеонаблюдения, охраны периметра, контроля доступа",
        category="производство",
        solution_description="Комплексная система безопасности для производства",
        requirements={
            "cameras": 60,
            "storage_days": 90,
            "resolution": "4K",
            "access_control": True,
            "perimeter_control": True,
            "emergency_systems": True,
            "type": "enterprise"
        }
    ),
]
