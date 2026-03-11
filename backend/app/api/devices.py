"""
API для работы с устройствами
"""
from fastapi import APIRouter, HTTPException
from app.models import Device
from app.schemas import DeviceCreateSchema
from app.storage import storage
from app.equipment_catalog import EQUIPMENT_CATALOG
from app.catalog_schema import (
    EquipmentTypeDefinition,
    EquipmentModelDefinition,
    CompatibilityRuleDefinition,
    NormalizedCatalogResponse,
    build_normalized_catalog,
)
from copy import deepcopy
from uuid import uuid4

router = APIRouter(prefix="/api", tags=["devices"])


def _catalog_snapshot() -> NormalizedCatalogResponse:
    return build_normalized_catalog(EQUIPMENT_CATALOG)


@router.get("/projects/{project_id}/devices", response_model=list)
async def list_devices(project_id: str):
    """Получить список устройств в проекте"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    return [
        {
            "id": d.id,
            "name": d.name,
            "device_type": d.device_type,
            "model": d.model,
            "manufacturer": d.manufacturer,
            "port_count": len(d.ports),
            "location": d.location,
        }
        for d in project.devices
    ]


@router.post("/projects/{project_id}/devices", response_model=dict)
async def add_device(project_id: str, schema: DeviceCreateSchema):
    """Добавить устройство в проект"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    device = Device(
        name=schema.name,
        device_type=schema.device_type,
        model=schema.model,
        manufacturer=schema.manufacturer,
        location=schema.location,
        notes=schema.notes,
    )
    
    project.add_device(device)
    storage.update_project(project_id, project)
    
    return {
        "id": device.id,
        "name": device.name,
        "device_type": device.device_type,
        "model": device.model,
        "manufacturer": device.manufacturer,
    }


@router.get("/equipment-catalog", response_model=dict)
async def get_equipment_catalog():
    """Получить каталог доступного оборудования"""
    catalog = {}
    for key, device in EQUIPMENT_CATALOG.items():
        catalog[key] = {
            "id": device.id,
            "name": device.name,
            "device_type": device.device_type,
            "model": device.model,
            "manufacturer": device.manufacturer,
            "power_consumption_watts": device.power_consumption_watts,
            "resolution": device.resolution,
            "storage_capacity_gb": device.storage_capacity_gb,
            "ports": [
                {
                    "name": p.name,
                    "port_type": p.port_type,
                    "speed_mbps": p.speed_mbps or 0,
                }
                for p in device.ports
            ],
        }
    return catalog


@router.get("/equipment-catalog/types", response_model=list[EquipmentTypeDefinition])
async def get_equipment_types():
    """Get normalized equipment type definitions."""
    return _catalog_snapshot().equipment_types


@router.get("/equipment-catalog/models", response_model=list[EquipmentModelDefinition])
async def get_equipment_models():
    """Get normalized equipment model entries."""
    return _catalog_snapshot().equipment_models


@router.get(
    "/equipment-catalog/compatibility-rules",
    response_model=list[CompatibilityRuleDefinition],
)
async def get_catalog_compatibility_rules():
    """Get compatibility rules attached to catalog port types."""
    return _catalog_snapshot().compatibility_rules


@router.get("/equipment-catalog/normalized", response_model=NormalizedCatalogResponse)
async def get_normalized_equipment_catalog():
    """Get full normalized catalog payload."""
    return _catalog_snapshot()


@router.post("/projects/{project_id}/devices-from-template", response_model=dict)
async def add_device_from_template(project_id: str, equipment_key: str):
    """Добавить устройство из каталога в проект (копирование)"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if equipment_key not in EQUIPMENT_CATALOG:
        raise HTTPException(status_code=404, detail="Оборудование не найдено в каталоге")
    
    # Копируем устройство из каталога
    template_device = EQUIPMENT_CATALOG[equipment_key]
    device = deepcopy(template_device)
    device.id = str(uuid4())
    for port in device.ports:
        port.id = str(uuid4())
    
    project.add_device(device)
    storage.update_project(project_id, project)
    
    return {
        "id": device.id,
        "name": device.name,
        "device_type": device.device_type,
        "model": device.model,
        "manufacturer": device.manufacturer,
        "port_count": len(device.ports),
    }


@router.get("/projects/{project_id}/devices/{device_id}", response_model=dict)
async def get_device(project_id: str, device_id: str):
    """Получить детали устройства"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    device = project.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено")
    
    return {
        "id": device.id,
        "name": device.name,
        "device_type": device.device_type,
        "model": device.model,
        "manufacturer": device.manufacturer,
        "power_consumption_watts": device.power_consumption_watts,
        "resolution": device.resolution,
        "storage_capacity_gb": device.storage_capacity_gb,
        "bandwidth_requires_mbps": device.bandwidth_requires_mbps,
        "ports": [
            {
                "id": p.id,
                "name": p.name,
                "port_type": p.port_type,
                "speed_mbps": p.speed_mbps,
                "power_watts": p.power_watts,
            }
            for p in device.ports
        ],
        "location": device.location,
        "notes": device.notes,
    }


@router.delete("/projects/{project_id}/devices/{device_id}")
async def delete_device(project_id: str, device_id: str):
    """Удалить устройство из проекта"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not project.get_device(device_id):
        raise HTTPException(status_code=404, detail="Устройство не найдено")
    
    project.devices = [d for d in project.devices if d.id != device_id]
    storage.update_project(project_id, project)
    
    return {"message": "Устройство удалено"}
