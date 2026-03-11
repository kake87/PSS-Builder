from typing import List, Optional
from pydantic import BaseModel, Field


class PortSchema(BaseModel):
    """Схема для работы с портами"""
    name: str
    port_type: str


class DeviceCreateSchema(BaseModel):
    """Схема для создания устройства"""
    name: str
    device_type: str
    model: str
    manufacturer: str
    location: Optional[str] = None
    notes: Optional[str] = None


class DeviceResponseSchema(BaseModel):
    """Схема ответа с устройством"""
    id: str
    name: str
    device_type: str
    model: str
    manufacturer: str
    ports: List[dict]
    location: Optional[str]


class LinkCreateSchema(BaseModel):
    """Схема для создания соединения"""
    from_device_id: str
    from_port_id: str
    to_device_id: str
    to_port_id: str
    cable_type: str
    length_meters: float


class ProjectCreateSchema(BaseModel):
    """Схема для создания проекта"""
    name: str
    description: str = ""


class ProjectResponseSchema(BaseModel):
    """Схема ответа с проектом"""
    id: str
    name: str
    description: str
    devices: List[dict]
    links: List[dict]
    status: str


class TemplateResponseSchema(BaseModel):
    """Схема ответа с шаблоном"""
    id: str
    name: str
    category: str
    description: str
    requirements: dict
