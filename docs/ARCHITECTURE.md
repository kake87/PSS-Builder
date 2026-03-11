# Архитектура PSS Builder

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────┐
│         React Frontend (в разработке)           │
│  (Графический редактор архитектур)              │
└──────────┬──────────────────────────────────────┘
           │
           │ REST API (JSON)
           ▼
┌─────────────────────────────────────────────────┐
│           FastAPI Backend                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         API Routes                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │  │
│  │  │Projects │  │Devices │  │Templates │ │  │
│  │  └─────────┘  └─────────┘  └──────────┘ │  │
│  │  ┌──────────┐  ┌────────────────────┐    │  │
│  │  │Rules    │  │Equipment Catalog   │    │  │
│  │  └──────────┘  └────────────────────┘    │  │
│  └──────────────────────────────────────────┘  │
│           ▲                  ▲                  │
│           │                  │                  │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │Storage Layer │  │Equipment Registry   │   │
│  │(In-Memory)   │  │(Device Catalog)     │   │
│  └──────────────┘  └──────────────────────┘   │
│           ▲                  ▲                  │
│           │                  │                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Data Models (Pydantic)                  │  │
│  │ ┌────────┐ ┌────────┐ ┌──────────────┐ │  │
│  │ │ Device │ │  Port  │ │Link/Cable   │ │  │
│  │ ├────────┤ ├────────┤ ├──────────────┤ │  │
│  │ │Project │ │ Rule   │ │  Template   │ │  │
│  │ └────────┘ └────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│           (Пока только В памяти)              │
│        (Будет: PostgreSQL, MongoDB)            │
└─────────────────────────────────────────────────┘
```

## Слои приложения

### 1. API Layer (`app/api/`)
- **projects.py** - управление проектами
- **devices.py** - управление устройствами
- **templates.py** - работа с шаблонами
- **rules.py** - управление правилами проверки

### 2. Data Models Layer (`app/models/`)
- **device.py** - Device, Port, DeviceType, PortType
- **link.py** - Link, Cable, CableType
- **rule.py** - Rule, RuleType, DEFAULT_RULES
- **project.py** - Project с методами валидации
- **template.py** - Template нормативное решение

### 3. Storage Layer (`app/storage.py`)
- Хранилище в памяти (InMemoryStorage)
- Методы CRUD для проектов, шаблонов, правил

### 4. Catalog Layer (`app/equipment_catalog.py`)
- Предустановленные модели оборудования
- Real-world устройства с реальными характеристиками

## Модель данных

```
Project
├── devices: List[Device]
│   ├── id: str
│   ├── name: str
│   ├── device_type: DeviceType (camera, server, switch, etc.)
│   ├── model: str
│   ├── manufacturer: str
│   ├── ports: List[Port]
│   │   ├── id: str
│   │   ├── name: str
│   │   ├── port_type: PortType (ethernet, power, serial, coax)
│   │   ├── speed_mbps: int (for Ethernet)
│   │   ├── power_watts: float (for Power)
│   │   └── connected_to: str (id of connected port)
│   ├── power_consumption_watts: float
│   ├── resolution: str
│   ├── storage_capacity_gb: int
│   ├── bandwidth_requires_mbps: int
│   └── location: str
│
├── links: List[Link]
│   ├── from_device_id: str
│   ├── from_port_id: str
│   ├── to_device_id: str
│   ├── to_port_id: str
│   ├── cable_type: CableType (cat5e, cat6, cat6a, fiber, coax, power)
│   └── length_meters: float
│
└── rules: Dict[str, Rule]
    ├── compatibility checks
    ├── cable length limits
    ├── power budget
    ├── bandwidth requirements
    ├── storage calculations
    └── compliance checks
```

## Типы устройств

```
Device Types:
├── CAMERA           - видеокамеры
├── SERVER          - серверы хранения
├── SWITCH          - коммутаторы
├── ACCESS_CONTROLLER - контроллеры доступа
├── NVR             - видеорегистраторы
├── UPS             - источники питания
└── GATEWAY         - шлюзы

Port Types:
├── ETHERNET        - стандартные сетевые порты
├── POWER          - силовые разъёмы
├── SERIAL         - серийные порты
└── COAX           - коаксиальные кабели

Cable Types:
├── CAT5E           - до 100м, 100 Мбит/с
├── CAT6            - до 100м, 1000 Мбит/с
├── CAT6A           - до 100м, 10000 Мбит/с
├── FIBER           - до нескольких км
├── COAX            - для видео
└── POWER_WIRE      - силовые линии
```

## API Endpoints

### Projects
```
GET    /api/projects                      - Список всех проектов
POST   /api/projects                      - Создать проект
GET    /api/projects/{project_id}         - Получить проект с деталями
POST   /api/projects/{project_id}/validate - Проверить проект
DELETE /api/projects/{project_id}         - Удалить проект
```

### Devices
```
GET    /api/projects/{project_id}/devices                 - Список устройств
POST   /api/projects/{project_id}/devices                 - Добавить устройство
POST   /api/projects/{project_id}/devices-from-template   - Добавить из каталога
GET    /api/projects/{project_id}/devices/{device_id}     - Деталь устройства
DELETE /api/projects/{project_id}/devices/{device_id}     - Удалить устройство
GET    /api/equipment-catalog                             - Каталог оборудования
```

### Templates
```
GET /api/templates                    - Список всех шаблонов
GET /api/templates/{template_id}      - Деталь шаблона
GET /api/templates/category/{cat}     - Шаблоны по категории
```

### Rules
```
GET /api/rules              - Список всех правил
GET /api/rules/{rule_type}  - Правила по типу
```

## Процесс валидации проекта

```python
project.validate() -> {
    "valid": bool,
    "errors": [str],       # Критические ошибки
    "warnings": [str]      # Предупреждения
}
```

Проверяется:
1. ✓ Целостность ссылок (все устройства существуют)
2. ✓ Существование портов
3. ✓ Совместимость портов
4. ✓ Типы кабелей
5. ✓ Максимальная длина кабеля
6. ✓ Требования к питанию
7. ✓ Требования к полосе пропускания
8. ✓ Требования к хранилищу

## Шаблоны решений

Встроенные шаблоны для быстрого старта:

```python
templates = [
    {
        "name": "Малый офис",
        "cameras": 6,
        "storage_days": 14,
        "resolution": "1080p",
        "type": "wired"
    },
    {
        "name": "Средний склад",
        "cameras": 20,
        "storage_days": 30,
        "resolution": "2K",
        "access_control": True
    },
    {
        "name": "Крупный магазин",
        "cameras": 40,
        "storage_days": 60,
        "resolution": "4K",
        "people_counting": True
    },
    {
        "name": "Производство",
        "cameras": 60,
        "storage_days": 90,
        "resolution": "4K",
        "perimeter_control": True
    }
]
```

## Технологический стек

### Backend
- **Python 3.8+** - язык программирования
- **FastAPI** - веб-фреймворк
- **Pydantic** - валидация данных
- **Uvicorn** - ASGI сервер

### Frontend (в разработке)
- **React 18+** - библиотека UI
- **TypeScript** - типизированный JavaScript
- **Zustand** - управление состоянием
- **Axios** - HTTP клиент

### Database (планируется)
- **PostgreSQL** - основная БД
- **MongoDB** - документооборот

## Поток данных

```
User
  │
  ▼
React UI (при готовности)
  │
  ▼
REST API (FastAPI)
  │
  ├─▶ Validation (Pydantic)
  │
  ├─▶ Business Logic
  │
  ├─▶ Rules Engine
  │
  ▼
Storage (Memory/DB)
  │
  ▼
Response (JSON)
  │
  ▼
Client
```

## Примеры использования

### Создание проекта со сборкой
```python
# 1. Создать проект
project = Project(name="Warehouse")

# 2. Добавить устройства
camera = deepcopy(EQUIPMENT_CATALOG["hikvision-4k"])
project.add_device(camera)

switch = deepcopy(EQUIPMENT_CATALOG["hikvision-24poe"])
project.add_device(switch)

# 3. Создать соединение
link = Link(
    from_device_id=camera.id,
    from_port_id=camera.ports[0].id,
    to_device_id=switch.id,
    to_port_id=switch.ports[0].id,
    cable_type=CableType.CAT6,
    length_meters=30
)
project.add_link(link)

# 4. Проверить и сохранить
validation = project.validate()
storage.create_project(project)
```

### Использование API
```bash
# Создать проект
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project"}'

# Добавить устройство
curl -X POST http://localhost:8000/api/projects/{id}/devices \
  -H "Content-Type: application/json" \
  -d '{"name":"Camera-01", "device_type":"camera", ...}'

# Проверить
curl http://localhost:8000/api/projects/{id}/validate
```

## Расширяемость

Система разработана так, чтобы легко добавлять:

1. **Новое оборудование** - добавьте в `equipment_catalog.py`
2. **Новые типы портов** - расширьте `PortType` enum
3. **Новые правила** - добавьте в `models/rule.py`
4. **Новые шаблоны** - расширьте `models/template.py`
5. **Персистентное хранилище** - замените `InMemoryStorage`
6. **AI режим** - добавьте LLM интеграцию

## Планы развития

- ✅ Ядро данных и API
- ✅ Каталог оборудования
- ✅ Система правил и валидации
- 🔄 React фронтенд
- ⏳ AI режим (автоматическое построение)
- ⏳ PostgreSQL интеграция
- ⏳ Экспорт в PDF/Visio
- ⏳ История версий
- ⏳ Совместное редактирование
