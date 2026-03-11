from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from uuid import uuid4


class CableType(str, Enum):
    """Типы кабелей"""
    CAT5E = "cat5e"
    CAT6 = "cat6"
    CAT6A = "cat6a"
    FIBER = "fiber"
    COAX = "coax"
    POWER_WIRE = "power_wire"


class Cable(BaseModel):
    """Описание типа кабеля"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    cable_type: CableType = Field(..., description="Тип кабеля")
    max_length_meters: int = Field(..., description="Максимальная длина кабеля в метрах")
    bandwidth_mbps: Optional[int] = Field(None, description="Максимальная пропускная способность")
    price_per_meter: float = Field(..., description="Цена за метр кабеля")
    
    class Config:
        use_enum_values = True


class Link(BaseModel):
    """Линия связи между портами"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    from_device_id: str = Field(..., description="ID устройства-источника")
    from_port_id: str = Field(..., description="ID порта-источника")
    to_device_id: str = Field(..., description="ID устройства-приёмника")
    to_port_id: str = Field(..., description="ID порта-приёмника")
    
    cable_type: CableType = Field(..., description="Тип кабеля")
    length_meters: float = Field(..., description="Длина кабеля в метрах")
    
    notes: Optional[str] = Field(None, description="Заметки о соединении")

    class Config:
        use_enum_values = True
