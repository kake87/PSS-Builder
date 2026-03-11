"""
API для управления проектами архитектур систем безопасности
"""
from fastapi import APIRouter, HTTPException
from app.models import Project, Device, Link, Template
from app.models.device import DeviceType, PortType
from app.schemas import ProjectCreateSchema, ProjectResponseSchema, TemplateResponseSchema
from app.storage import storage

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects", response_model=list)
async def list_projects():
    """Получить список всех проектов"""
    projects = storage.list_projects()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "device_count": len(p.devices),
            "link_count": len(p.links),
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]


@router.post("/projects", response_model=dict)
async def create_project(schema: ProjectCreateSchema):
    """Создать новый проект"""
    project = Project(name=schema.name, description=schema.description)
    storage.create_project(project)
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "created_at": project.created_at.isoformat(),
    }


@router.get("/projects/{project_id}", response_model=dict)
async def get_project(project_id: str):
    """Получить детали проекта"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "devices": [
            {
                "id": d.id,
                "name": d.name,
                "device_type": d.device_type,
                "model": d.model,
                "manufacturer": d.manufacturer,
                "ports": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "port_type": p.port_type,
                        "speed_mbps": p.speed_mbps,
                    }
                    for p in d.ports
                ],
            }
            for d in project.devices
        ],
        "links": [
            {
                "id": l.id,
                "from_device_id": l.from_device_id,
                "from_port_id": l.from_port_id,
                "to_device_id": l.to_device_id,
                "to_port_id": l.to_port_id,
                "cable_type": l.cable_type,
                "length_meters": l.length_meters,
            }
            for l in project.links
        ],
        "status": project.status,
        "validation": project.validate(),
    }


@router.post("/projects/{project_id}/validate", response_model=dict)
async def validate_project(project_id: str):
    """Проверить проект на ошибки"""
    project = storage.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    return project.validate()


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Удалить проект"""
    if not storage.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    return {"message": "Проект удалён"}
