from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import uuid4


class DeviceType(str, Enum):
    """Типы устройств системы безопасности"""
    CAMERA = "camera"  # Камера видеонаблюдения
    SERVER = "server"  # Сервер хранения
    SWITCH = "switch"  # Коммутатор
    ACCESS_CONTROLLER = "access_controller"  # Контроллер доступа
    NVR = "nvr"  # Видеорегистратор
    UPS = "ups"  # Источник бесперебойного питания
    GATEWAY = "gateway"  # Шлюз


class PortType(str, Enum):
    """Типы портов"""
    ETHERNET = "ethernet"
    POWER = "power"
    SERIAL = "serial"
    COAX = "coax"


class Port(BaseModel):
    """Порт устройства"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Имя порта (например: ETH1, POE1)")
    port_type: PortType = Field(..., description="Тип порта")
    speed_mbps: Optional[int] = Field(None, description="Скорость в Мбит/с (для Ethernet)")
    power_watts: Optional[float] = Field(None, description="Максимальная мощность (для Power)")
    connected_to: Optional[str] = Field(None, description="ID другого порта, если подключёно")

    class Config:
        use_enum_values = True


class Device(BaseModel):
    """Устройство системы безопасности"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Название устройства (например: Camera-01)")
    device_type: DeviceType = Field(..., description="Тип устройства")
    model: str = Field(..., description="Модель устройства")
    manufacturer: str = Field(..., description="Производитель")
    ports: List[Port] = Field(default_factory=list, description="Список портов")
    
    # Характеристики
    power_consumption_watts: Optional[float] = Field(None, description="Потребление энергии в Вт")
    resolution: Optional[str] = Field(None, description="Разрешение (для камер)")
    storage_capacity_gb: Optional[int] = Field(None, description="Объём хранилища (для серверов)")
    bandwidth_requires_mbps: Optional[int] = Field(None, description="Требуемая пропускная способность")
    
    # Местоположение
    location: Optional[str] = Field(None, description="Местоположение устройства")
    notes: Optional[str] = Field(None, description="Дополнительные заметки")

    class Config:
        use_enum_values = True

    def add_port(self, name: str, port_type: PortType, **kwargs) -> Port:
        """Добавить порт к устройству"""
        port = Port(name=name, port_type=port_type, **kwargs)
        self.ports.append(port)
        return port

    def get_port(self, port_id: str) -> Optional[Port]:
        """Получить порт по ID"""
        return next((p for p in self.ports if p.id == port_id), None)
