"""
API для шаблонов решений
"""
from fastapi import APIRouter, HTTPException
from app.storage import storage

router = APIRouter(prefix="/api", tags=["templates"])


@router.get("/templates", response_model=list)
async def list_templates():
    """Получить список всех шаблонов решений"""
    templates = storage.list_templates()
    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "description": t.description,
            "requirements": t.requirements,
        }
        for t in templates
    ]


@router.get("/templates/{template_id}", response_model=dict)
async def get_template(template_id: str):
    """Получить детали шаблона"""
    template = storage.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    return {
        "id": template.id,
        "name": template.name,
        "category": template.category,
        "description": template.description,
        "solution_description": template.solution_description,
        "requirements": template.requirements,
    }


@router.get("/templates/category/{category}", response_model=list)
async def get_templates_by_category(category: str):
    """Получить шаблоны по категории"""
    templates = storage.list_templates()
    filtered = [t for t in templates if t.category == category]
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "description": t.description,
            "requirements": t.requirements,
        }
        for t in filtered
    ]
