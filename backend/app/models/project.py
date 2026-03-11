from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import uuid4
from .device import Device
from .link import Link


class Project(BaseModel):
    """Проект архитектуры системы безопасности"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Название проекта")
    description: str = Field("", description="Описание проекта")
    
    devices: List[Device] = Field(default_factory=list, description="Список устройств")
    links: List[Link] = Field(default_factory=list, description="Список соединений")
    
    # Требования проекта
    requirements: dict = Field(default_factory=dict, description="Требования проекта")
    
    # Метаданные
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    status: str = Field("draft", description="Статус проекта (draft, review, approved, implemented)")
    
    class Config:
        use_enum_values = True

    def add_device(self, device: Device) -> Device:
        """Добавить устройство в проект"""
        self.devices.append(device)
        self.updated_at = datetime.now()
        return device

    def add_link(self, link: Link) -> Link:
        """Добавить соединение в проект"""
        self.links.append(link)
        self.updated_at = datetime.now()
        return link

    def get_device(self, device_id: str) -> Optional[Device]:
        """Получить устройство по ID"""
        return next((d for d in self.devices if d.id == device_id), None)

    def get_link(self, link_id: str) -> Optional[Link]:
        """Получить соединение по ID"""
        return next((l for l in self.links if l.id == link_id), None)

    def validate(self) -> dict:
        """Проверить проект на ошибки"""
        errors = []
        warnings = []
        
        # Проверка целостности ссылок
        device_ids = {d.id for d in self.devices}
        for link in self.links:
            if link.from_device_id not in device_ids:
                errors.append(f"Соединение {link.id}: источник {link.from_device_id} не найден")
            if link.to_device_id not in device_ids:
                errors.append(f"Соединение {link.id}: приёмник {link.to_device_id} не найден")
        
        # Проверка портов
        for device in self.devices:
            for link in self.links:
                if link.from_device_id == device.id:
                    if not device.get_port(link.from_port_id):
                        warnings.append(f"Порт {link.from_port_id} не найден у {device.name}")
                if link.to_device_id == device.id:
                    if not device.get_port(link.to_port_id):
                        warnings.append(f"Порт {link.to_port_id} не найден у {device.name}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
