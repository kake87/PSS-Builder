"""
Devices and equipment catalog API.
"""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from pydantic import BaseModel, Field

from app.catalog_schema import (
    CompatibilityRuleDefinition,
    EquipmentModelDefinition,
    EquipmentTypeDefinition,
    NormalizedCatalogResponse,
)
from app.catalog_importer import (
    import_hikvision_model_from_url,
    import_hikvision_models_from_category,
)
from app.equipment_catalog import EQUIPMENT_CATALOG
from app.models import Device
from app.models.device import PortType
from app.schemas import DeviceCreateSchema
from app.storage import storage

router = APIRouter(prefix="/api", tags=["devices"])


class ImportCatalogUrlRequest(BaseModel):
    url: str = Field(..., min_length=10)
    type_key: str = "camera"
    lifecycle_status: str = "verified"


class ImportCatalogCategoryRequest(BaseModel):
    category_url: str = Field(..., min_length=10)
    type_key: str = "camera"
    lifecycle_status: str = "verified"
    max_items: int = Field(default=60, ge=1, le=300)


class UpdateModelStatusRequest(BaseModel):
    status: str = Field(..., min_length=3)
    actor: str = "catalog-reviewer"
    note: str | None = None


def _catalog_snapshot() -> NormalizedCatalogResponse:
    return storage.get_normalized_catalog()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


ALLOWED_STATUSES = {"draft", "verified", "deprecated"}

STATUS_TRANSITIONS = {
    "draft": {"verified", "deprecated"},
    "verified": {"draft", "deprecated"},
    "deprecated": {"draft", "verified"},
}


def _build_device_from_model(model: EquipmentModelDefinition) -> Device:
    try:
        device = Device(
            name=model.name,
            device_type=model.type_key,
            model=model.model,
            manufacturer=model.manufacturer,
            power_consumption_watts=model.power_consumption_watts,
            resolution=model.resolution,
            storage_capacity_gb=model.storage_capacity_gb,
            bandwidth_requires_mbps=model.bandwidth_requires_mbps,
        )
    except ValidationError:
        device = Device(
            name=model.name,
            device_type="gateway",
            model=model.model,
            manufacturer=model.manufacturer,
            power_consumption_watts=model.power_consumption_watts,
            resolution=model.resolution,
            storage_capacity_gb=model.storage_capacity_gb,
            bandwidth_requires_mbps=model.bandwidth_requires_mbps,
            notes=f"Original type_key: {model.type_key}",
        )
    for port in model.ports:
        try:
            port_type = PortType(str(port.port_type))
        except ValueError:
            port_type = PortType.ETHERNET
        device.add_port(
            port.name,
            port_type,
            speed_mbps=port.speed_mbps,
            power_watts=port.power_watts,
        )
    return device


@router.get("/projects/{project_id}/devices", response_model=list)
async def list_devices(project_id: str):
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
    catalog = {}
    snapshot = _catalog_snapshot()
    for model in snapshot.equipment_models:
        catalog[model.key] = {
            "id": model.id,
            "name": model.name,
            "device_type": model.type_key,
            "model": model.model,
            "manufacturer": model.manufacturer,
            "power_consumption_watts": model.power_consumption_watts,
            "resolution": model.resolution,
            "storage_capacity_gb": model.storage_capacity_gb,
            "bandwidth_requires_mbps": model.bandwidth_requires_mbps,
            "lifecycle_status": model.lifecycle_status,
            "ports": [
                {
                    "name": p.name,
                    "port_type": p.port_type,
                    "speed_mbps": p.speed_mbps or 0,
                    "power_watts": p.power_watts or 0,
                }
                for p in model.ports
            ],
        }
    return catalog


@router.get("/equipment-catalog/types", response_model=list[EquipmentTypeDefinition])
async def get_equipment_types():
    return _catalog_snapshot().equipment_types


@router.post("/equipment-catalog/types", response_model=EquipmentTypeDefinition)
async def upsert_equipment_type(item: EquipmentTypeDefinition):
    return storage.upsert_equipment_type(item)


@router.delete("/equipment-catalog/types/{type_key}", response_model=dict)
async def delete_equipment_type(type_key: str):
    if not storage.delete_equipment_type(type_key):
        raise HTTPException(status_code=404, detail="Equipment type not found")
    return {"message": "Equipment type deleted"}


@router.get("/equipment-catalog/models", response_model=list[EquipmentModelDefinition])
async def get_equipment_models():
    return _catalog_snapshot().equipment_models


@router.post("/equipment-catalog/models", response_model=EquipmentModelDefinition)
async def upsert_equipment_model(item: EquipmentModelDefinition):
    existing = next((model for model in _catalog_snapshot().equipment_models if model.key == item.key), None)
    current_time = _now_iso()
    updated_by = item.updated_by or "catalog-editor"

    status_history = list(item.status_history or [])
    if existing and existing.lifecycle_status != item.lifecycle_status:
        status_history.append(
            {
                "from_status": existing.lifecycle_status,
                "to_status": item.lifecycle_status,
                "changed_at": current_time,
                "changed_by": updated_by,
                "note": "Status updated via model edit",
            }
        )

    item = item.model_copy(
        update={
            "updated_at": current_time,
            "updated_by": updated_by,
            "status_history": status_history,
        }
    )
    return storage.upsert_equipment_model(item)


@router.post("/equipment-catalog/models/bulk", response_model=list[EquipmentModelDefinition])
async def upsert_equipment_models_bulk(items: list[EquipmentModelDefinition]):
    return [storage.upsert_equipment_model(item) for item in items]


@router.delete("/equipment-catalog/models/{model_key}", response_model=dict)
async def delete_equipment_model(model_key: str):
    if not storage.delete_equipment_model(model_key):
        raise HTTPException(status_code=404, detail="Equipment model not found")
    return {"message": "Equipment model deleted"}


@router.post("/equipment-catalog/models/{model_key}/status", response_model=EquipmentModelDefinition)
async def update_equipment_model_status(model_key: str, payload: UpdateModelStatusRequest):
    target_status = payload.status.strip().lower()
    if target_status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Unsupported status transition target")

    snapshot = _catalog_snapshot()
    model = next((item for item in snapshot.equipment_models if item.key == model_key), None)
    if not model:
        raise HTTPException(status_code=404, detail="Equipment model not found")

    current_status = (model.lifecycle_status or "draft").lower()
    if current_status == target_status:
        return model

    allowed_targets = STATUS_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=400,
            detail=f"Transition from {current_status} to {target_status} is not allowed",
        )

    changed_at = _now_iso()
    updated_history = list(model.status_history or [])
    updated_history.append(
        {
            "from_status": current_status,
            "to_status": target_status,
            "changed_at": changed_at,
            "changed_by": payload.actor.strip() or "catalog-reviewer",
            "note": payload.note,
        }
    )

    updated_model = model.model_copy(
        update={
            "lifecycle_status": target_status,
            "updated_at": changed_at,
            "updated_by": payload.actor.strip() or "catalog-reviewer",
            "status_history": updated_history,
        }
    )
    return storage.upsert_equipment_model(updated_model)


@router.get(
    "/equipment-catalog/compatibility-rules",
    response_model=list[CompatibilityRuleDefinition],
)
async def get_catalog_compatibility_rules():
    return _catalog_snapshot().compatibility_rules


@router.post(
    "/equipment-catalog/compatibility-rules",
    response_model=CompatibilityRuleDefinition,
)
async def upsert_catalog_compatibility_rule(item: CompatibilityRuleDefinition):
    return storage.upsert_compatibility_rule(item)


@router.delete("/equipment-catalog/compatibility-rules/{rule_key}", response_model=dict)
async def delete_catalog_compatibility_rule(rule_key: str):
    if not storage.delete_compatibility_rule(rule_key):
        raise HTTPException(status_code=404, detail="Compatibility rule not found")
    return {"message": "Compatibility rule deleted"}


@router.get("/equipment-catalog/normalized", response_model=NormalizedCatalogResponse)
async def get_normalized_equipment_catalog():
    return _catalog_snapshot()


@router.post("/equipment-catalog/normalized/refresh", response_model=NormalizedCatalogResponse)
async def refresh_normalized_equipment_catalog():
    return storage.refresh_normalized_catalog()


@router.post("/equipment-catalog/models/import-url", response_model=EquipmentModelDefinition)
async def import_equipment_model_from_url(payload: ImportCatalogUrlRequest):
    try:
        model = import_hikvision_model_from_url(
            payload.url,
            type_key=payload.type_key,
            lifecycle_status=payload.lifecycle_status,
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Import failed: {error}") from error
    return storage.upsert_equipment_model(model)


@router.post("/equipment-catalog/models/import-url/bulk", response_model=list[EquipmentModelDefinition])
async def import_equipment_models_from_urls(payload: list[ImportCatalogUrlRequest]):
    results: list[EquipmentModelDefinition] = []
    errors: list[str] = []

    for entry in payload:
        try:
            model = import_hikvision_model_from_url(
                entry.url,
                type_key=entry.type_key,
                lifecycle_status=entry.lifecycle_status,
            )
            results.append(storage.upsert_equipment_model(model))
        except Exception as error:
            errors.append(f"{entry.url}: {error}")

    if not results and errors:
        raise HTTPException(status_code=400, detail={"message": "Bulk import failed", "errors": errors})
    return results


@router.post("/equipment-catalog/models/import-category", response_model=dict)
async def import_equipment_models_from_category(payload: ImportCatalogCategoryRequest):
    try:
        imported_models, errors, discovered_urls = import_hikvision_models_from_category(
            payload.category_url,
            type_key=payload.type_key,
            lifecycle_status=payload.lifecycle_status,
            max_items=payload.max_items,
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Category import failed: {error}") from error

    persisted: list[EquipmentModelDefinition] = []
    for model in imported_models:
        persisted.append(storage.upsert_equipment_model(model))

    return {
        "category_url": payload.category_url,
        "discovered_urls": len(discovered_urls),
        "imported_models": len(persisted),
        "failed_models": len(errors),
        "errors": errors,
        "models": persisted,
    }


@router.post("/projects/{project_id}/devices-from-template", response_model=dict)
async def add_device_from_template(project_id: str, equipment_key: str):
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    snapshot = _catalog_snapshot()
    model = next((item for item in snapshot.equipment_models if item.key == equipment_key), None)

    if model:
        device = _build_device_from_model(model)
        device.id = str(uuid4())
        for port in device.ports:
            port.id = str(uuid4())
    else:
        if equipment_key not in EQUIPMENT_CATALOG:
            raise HTTPException(status_code=404, detail="Equipment not found in catalog")
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
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    device = project.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

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
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.get_device(device_id):
        raise HTTPException(status_code=404, detail="Device not found")

    project.devices = [d for d in project.devices if d.id != device_id]
    storage.update_project(project_id, project)

    return {"message": "Device deleted"}
