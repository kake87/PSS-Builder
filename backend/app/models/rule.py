from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import uuid4


class RuleType(str, Enum):
    """Типы нормативных правил"""
    COMPATIBILITY = "compatibility"  # Совместимость оборудования
    CABLE_LENGTH = "cable_length"  # Максимальная длина кабеля
    POWER_BUDGET = "power_budget"  # Бюджет питания
    BANDWIDTH = "bandwidth"  # Полоса пропускания
    STORAGE = "storage"  # Объём хранилища
    COMPLIANCE = "compliance"  # Нормативное соответствие


class Rule(BaseModel):
    """Нормативное правило"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Название правила")
    rule_type: RuleType = Field(..., description="Тип правила")
    description: str = Field(..., description="Описание правила")
    
    # Параметры правила
    parameters: dict = Field(default_factory=dict, description="Параметры правила")
    severity: str = Field("warning", description="Серьёзность нарушения (info, warning, error)")
    
    enabled: bool = Field(True, description="Активно ли правило")

    class Config:
        use_enum_values = True


# Встроенные правила по умолчанию
DEFAULT_RULES = [
    Rule(
        name="Максимальная длина Ethernet кабеля",
        rule_type=RuleType.CABLE_LENGTH,
        description="Кабель Cat5e/Cat6 не должен превышать 100 метров",
        parameters={"cable_types": ["cat5e", "cat6"], "max_length": 100},
        severity="error"
    ),
    Rule(
        name="Максимальная длина кабеля PoE",
        rule_type=RuleType.CABLE_LENGTH,
        description="Расстояние для PoE до 100 метров",
        parameters={"technology": "poe", "max_length": 100},
        severity="warning"
    ),
    Rule(
        name="Полоса пропускания для видеопотока",
        rule_type=RuleType.BANDWIDTH,
        description="Одна HD камера требует минимум 4-8 Мбит/с",
        parameters={"min_bandwidth_per_camera": 4},
        severity="warning"
    ),
    Rule(
        name="Требования к хранилищу",
        rule_type=RuleType.STORAGE,
        description="Архив 30 дней = примерно 50-100 ГБ на камеру в HD",
        parameters={"days": 30, "gb_per_camera_per_day": 2},
        severity="warning"
    ),
]
