# PSS Builder - Security Systems Architecture Constructor

## 📋 О проекте

Конструктор архитектур систем безопасности (видеонаблюдение, СКУД, периметральная охрана) для инженеров. Система позволяет:

- ✅ Быстро собирать архитектуру систем из компонентов
- ✅ Проверять техническую корректность
- ✅ Учитывать реальные ограничения (кабели, питание, пропускная способность)
- ✅ Формировать черновой проект автоматически

## 🏗️ Структура проекта

```
PSS Builder/
├── backend/               # Бэкенд на Python/FastAPI
│   ├── app/
│   │   ├── models/       # Модели данных (Device, Port, Link, etc.)
│   │   ├── schemas/      # Pydantic схемы для API
│   │   ├── api/          # API маршруты
│   │   ├── main.py       # Главное приложение FastAPI
│   │   ├── storage.py    # Хранилище данных в памяти
│   │   └── equipment_catalog.py  # Каталог оборудования
│   └── requirements.txt   # Зависимости Python
├── frontend/              # Фронтенд на React (в разработке)
├── docs/                  # Документация
├── manifest.txt          # Технический манифест проекта
└── run.py               # Точка входа для запуска приложения
```

## 🚀 Быстрый старт

### Backend

1. Создайте виртуальное окружение:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Запустите приложение:
```bash
python -m app.main
```

Или из корня проекта:
```bash
python run.py
```

Приложение будет доступно по адресу: `http://localhost:8000`
API документация: `http://localhost:8000/docs`

## 📚 Основные сущности

### Device (Устройство)
Камеры, серверы, коммутаторы, контроллеры доступа, UPS и др.

```python
device = Device(
    name="Camera-01",
    device_type=DeviceType.CAMERA,
    model="DS-2CD2143G2-I",
    manufacturer="Hikvision"
)
```

### Port (Порт)
Порты устройств: Ethernet, PoE, Serial и др.

```python
camera.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)
camera.add_port("POE", PortType.POWER, power_watts=12)
```

### Link (Соединение)
Связь между портами двух устройств с определением типа кабеля.

```python
link = Link(
    from_device_id=camera.id,
    from_port_id=port_id_1,
    to_device_id=switch.id,
    to_port_id=port_id_2,
    cable_type=CableType.CAT6,
    length_meters=50
)
```

### Project (Проект)
Основной контейнер для архитектуры системы.

```python
project = Project(
    name="Warehouse Security System",
    description="Security system for warehouse"
)
project.add_device(camera)
project.add_link(link)
```

### Template (Шаблон)
Готовые решения для быстрой сборки:
- Малый офис (4-6 камер)
- Средний склад (15-20 камер)
- Крупный магазин (40+ камер)
- Производство (60+ камер)

### Rule (Правило)
Нормативные правила для проверки:
- Совместимость оборудования
- Максимальная длина кабеля
- Бюджет питания
- Полоса пропускания
- Требования к хранилищу

## 🔌 API Endpoints

### Проекты
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создать проект
- `GET /api/projects/{project_id}` - Получить проект
- `POST /api/projects/{project_id}/validate` - Проверить проект
- `DELETE /api/projects/{project_id}` - Удалить проект

### Устройства
- `GET /api/projects/{project_id}/devices` - Список устройств
- `POST /api/projects/{project_id}/devices` - Добавить устройство
- `GET /api/equipment-catalog` - Каталог оборудования
- `POST /api/projects/{project_id}/devices-from-template` - Добавить из каталога

### Шаблоны
- `GET /api/templates` - Список шаблонов
- `GET /api/templates/{template_id}` - Получить шаблон
- `GET /api/templates/category/{category}` - Шаблоны по категории

### Правила
- `GET /api/rules` - Список правил
- `GET /api/rules/{rule_type}` - Правила по типу

## 📦 Каталог оборудования

В системе предустановлены реальные модели оборудования:

**Камеры:**
- Hikvision DS-2CD2143G2-I (4K)
- Dahua IPC-HDBW2431E (2K)
- Uniview IPC322SR (1080p)

**Коммутаторы:**
- Cisco Catalyst 2960X (48 портов)
- Hikvision DS-3E0524P-E (24 PoE порта)
- Netgear PoE+ (16 портов)

**Серверы:**
- Hikvision NVR DS-7632NI-K2 (32 канала)
- Dell PowerEdge R750

**Контроллеры доступа:**
- Hikvision DS-K2604T
- ZKTeco ProCapture EC220

**Питание:**
- APC Smart-UPS 5000VA

## 🛠️ Разработка

### Структура кода
- Модели данных в `app/models/` - чистые Pydantic модели
- API маршруты в `app/api/` - FastAPI эндпоинты 
- Хранилище в `app/storage.py` - управление данными в памяти
- Каталог в `app/equipment_catalog.py` - предустановленное оборудование

### Запуск в development режиме
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

## 📝 Примеры использования

### Создание проекта
```python
from app.storage import storage
from app.models import Project

# Создать проект
project = Project(name="My Security System")
storage.create_project(project)

# Добавить камеру из каталога
from copy import deepcopy
from app.equipment_catalog import EQUIPMENT_CATALOG

camera = deepcopy(EQUIPMENT_CATALOG["hikvision-4k"])
project.add_device(camera)

# Добавить коммутатор
switch = deepcopy(EQUIPMENT_CATALOG["hikvision-24poe"])
project.add_device(switch)

# Создать соединение
from app.models.link import Link, CableType
link = Link(
    from_device_id=camera.id,
    from_port_id=camera.ports[0].id,
    to_device_id=switch.id,
    to_port_id=switch.ports[0].id,
    cable_type=CableType.CAT6,
    length_meters=30
)
project.add_link(link)

# Проверить проект
validation_result = project.validate()
print(validation_result)
```

## 🎯 Планы развития

- [ ] AI режим для автоматического построения архитектуры по текстовому описанию
- [ ] Расширенная проверка совместимости оборудования
- [ ] Расчёт расстояний и маршрутизация кабелей
- [ ] Генерация спецификации в PDF
- [ ] Графический редактор архитектуры (React фронтенд)
- [ ] Экспорт в различные форматы (JSON, Visio и др.)
- [ ] База данных для сохранения проектов

## 📄 Лицензия

MIT

## 👨‍💻 Автор

Создано как инженерный инструмент для системостроения.
