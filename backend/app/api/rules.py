"""
API для управления правилами
"""
from fastapi import APIRouter, HTTPException
from app.storage import storage

router = APIRouter(prefix="/api", tags=["rules"])


@router.get("/rules", response_model=list)
async def list_rules():
    """Получить список всех правил"""
    rules = storage.list_rules()
    return [
        {
            "id": r.id,
            "name": r.name,
            "rule_type": r.rule_type,
            "description": r.description,
            "severity": r.severity,
            "enabled": r.enabled,
        }
        for r in rules
    ]


@router.get("/rules/{rule_type}", response_model=list)
async def get_rules_by_type(rule_type: str):
    """Получить правила по типу"""
    rules = storage.list_rules()
    filtered = [r for r in rules if r.rule_type == rule_type]
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "rule_type": r.rule_type,
            "description": r.description,
            "parameters": r.parameters,
            "severity": r.severity,
            "enabled": r.enabled,
        }
        for r in filtered
    ]
