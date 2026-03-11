# ⚡ Quick Start Guide

## 1️⃣ Установка Backend

### Шаг 1: Создайте виртуальное окружение
```bash
cd "c:\Users\user\Desktop\Python\Codes\PSS builder\backend"
python -m venv venv
venv\Scripts\activate
```

### Шаг 2: Установите зависимости
```bash
pip install -r requirements.txt
```

### Шаг 3: Запустите приложение
```bash
python -m app.main
```

Приложение будет доступно по адресу: **http://localhost:8000**

API документация (Swagger): **http://localhost:8000/docs**

## 2️⃣ Запуск примеров

Из корневой папки проекта:
```bash
python example.py
```

Это создаст два примера проектов:
- Малый офис с 3 камерами
- Средний склад с 5 камерами

## 3️⃣ Прямое использование API

### Создать проект
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "description": "My security system"}'
```

### Получить список проектов
```bash
curl http://localhost:8000/api/projects
```

### Получить каталог оборудования
```bash
curl http://localhost:8000/api/equipment-catalog
```

### Получить шаблоны
```bash
curl http://localhost:8000/api/templates
```

## 4️⃣ Структура проекта

```
PSS Builder/
├── backend/              # Python/FastAPI приложение
│   ├── app/
│   │   ├── models/      # Модели данных
│   │   ├── schemas/     # API схемы
│   │   ├── api/         # API маршруты
│   │   ├── main.py      # Главное приложение
│   │   ├── storage.py   # Хранилище
│   │   └── equipment_catalog.py
│   └── requirements.txt
├── frontend/            # React приложение (в разработке)
│   ├── public/
│   └── src/
├── docs/               # Документация
├── example.py          # Примеры использования
├── run.py             # Запуск приложения
├── README.md          # Полная документация
└── manifest.txt       # Оригинальный манифест
```

## 5️⃣ Основные компоненты

### Device (Устройство)
Камеры, серверы, коммутаторы, контроллеры доступа

### Port (Порт)
Порты устройств: Ethernet, PoE, Serial, Power

### Link (Соединение)
Кабельная сеть между портами двух устройств

### Project (Проект)
Контейнер для всей архитектуры системы

### Template (Шаблон)
Готовые решения:
- Малый офис
- Средний склад
- Крупный магазин
- Производственное предприятие

### Rule (Правило)
Проверочные правила:
- Совместимость оборудования
- Максимальная длина кабеля
- Бюджет питания
- Полоса пропускания
- Требования к хранилищу

## 6️⃣ Доступное оборудование

### Камеры
- Hikvision DS-2CD2143G2-I (4K)
- Dahua IPC-HDBW2431E (2K)
- Uniview IPC322SR (1080p)

### Коммутаторы
- Cisco Catalyst 2960X (48 портов)
- Hikvision DS-3E0524P-E (24 PoE)
- Netgear PoE+ (16 портов)

### Серверы
- Hikvision NVR DS-7632NI-K2
- Dell PowerEdge R750

### Контроллеры доступа
- Hikvision DS-K2604T
- ZKTeco ProCapture EC220

### Источники питания
- APC Smart-UPS 5000VA

## 7️⃣ API Endpoints

**Проекты:**
- `GET /api/projects` - Список всех проектов
- `POST /api/projects` - Создать проект
- `GET /api/projects/{id}` - Получить проект
- `POST /api/projects/{id}/validate` - Проверить проект
- `DELETE /api/projects/{id}` - Удалить проект

**Устройства:**
- `GET /api/projects/{id}/devices` - Список устройств
- `POST /api/projects/{id}/devices` - Добавить устройство
- `GET /api/equipment-catalog` - Каталог оборудования

**Шаблоны:**
- `GET /api/templates` - Список шаблонов
- `GET /api/templates/{id}` - Показать шаблон

**Правила:**
- `GET /api/rules` - Список правил
- `GET /api/rules/{type}` - Правила по типу

## 8️⃣ Примеры на Python

```python
from app.models import Project, Device
from app.models.device import DeviceType, PortType
from app.storage import storage

# Создать проект
project = Project(name="My System")

# Создать устройство
camera = Device(
    name="Camera-01",
    device_type=DeviceType.CAMERA,
    model="DS-2CD2143G2-I",
    manufacturer="Hikvision"
)

# Добавить порт
camera.add_port("ETH1", PortType.ETHERNET, speed_mbps=1000)

# Добавить в проект
project.add_device(camera)

# Сохранить
storage.create_project(project)

# Проверить
validation = project.validate()
print(validation)
```

## 9️⃣ Поддержка

При возникновении проблем:
1. Убедитесь, что используется Python 3.8+
2. Проверьте установку зависимостей: `pip list`
3. Посмотрите документацию в `README.md`
4. Запустите примеры: `python example.py`

## 🔟 Следующие шаги

1. Установите и запустите Backend
2. Изучите примеры в `example.py`
3. Экспериментируйте с API через Swagger UI
4. Разработайте React фронтенд (документация в `frontend/SETUP.md`)
5. Добавьте собственное оборудование в каталог
6. Создайте собственные шаблоны решений

---

**Готово!** 🎉 Ваше приложение PSS Builder установлено и готово к использованию.
