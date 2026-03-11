"""
Пример использования PSS Builder
Создание простого проекта системы видеонаблюдения для офиса
"""
import sys
import io
sys.path.insert(0, 'backend')

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from app.models import Project
from app.models.link import Link, CableType
from app.storage import storage
from app.equipment_catalog import EQUIPMENT_CATALOG
from copy import deepcopy


def example_small_office():
    """Пример: Система видеонаблюдения для офиса"""
    print("=" * 60)
    print("Пример 1: Система видеонаблюдения для малого офиса")
    print("=" * 60)
    
    # Создаём проект
    project = Project(
        name="Small Office Security",
        description="Система видеонаблюдения для офисного помещения"
    )
    
    # Добавляем оборудование из каталога
    camera_1 = deepcopy(EQUIPMENT_CATALOG["hikvision-4k"])
    camera_1.name = "Office-Camera-01"
    camera_1.location = "Входная дверь"
    project.add_device(camera_1)
    
    camera_2 = deepcopy(EQUIPMENT_CATALOG["hikvision-4k"])
    camera_2.name = "Office-Camera-02"
    camera_2.location = "Переговорная 1"
    project.add_device(camera_2)
    
    camera_3 = deepcopy(EQUIPMENT_CATALOG["dahua-2k"])
    camera_3.name = "Office-Camera-03"
    camera_3.location = "Рабочее место"
    project.add_device(camera_3)
    
    # Коммутатор
    switch = deepcopy(EQUIPMENT_CATALOG["netgear-16poe"])
    switch.name = "Office-Switch-01"
    switch.location = "Серверная"
    project.add_device(switch)
    
    # NVR
    nvr = deepcopy(EQUIPMENT_CATALOG["nvr-hikvision-32ch"])
    nvr.name = "Office-NVR-01"
    nvr.location = "Серверная"
    project.add_device(nvr)
    
    # Соединение камер со коммутатором
    link1 = Link(
        from_device_id=camera_1.id,
        from_port_id=camera_1.ports[0].id,
        to_device_id=switch.id,
        to_port_id=switch.ports[0].id,
        cable_type=CableType.CAT6,
        length_meters=20
    )
    project.add_link(link1)
    
    link2 = Link(
        from_device_id=camera_2.id,
        from_port_id=camera_2.ports[0].id,
        to_device_id=switch.id,
        to_port_id=switch.ports[1].id,
        cable_type=CableType.CAT6,
        length_meters=30
    )
    project.add_link(link2)
    
    link3 = Link(
        from_device_id=camera_3.id,
        from_port_id=camera_3.ports[0].id,
        to_device_id=switch.id,
        to_port_id=switch.ports[2].id,
        cable_type=CableType.CAT6,
        length_meters=25
    )
    project.add_link(link3)
    
    # Соединение коммутатора с NVR
    link_nvr = Link(
        from_device_id=switch.id,
        from_port_id=switch.ports[15].id,
        to_device_id=nvr.id,
        to_port_id=nvr.ports[0].id,
        cable_type=CableType.CAT6,
        length_meters=5
    )
    project.add_link(link_nvr)
    
    # Сохраняем проект
    storage.create_project(project)
    
    # Выводим информацию
    print(f"\nПроект: {project.name}")
    print(f"Описание: {project.description}")
    print(f"ID: {project.id}")
    print(f"\nОборудование:")
    for device in project.devices:
        print(f"  - {device.name} ({device.device_type}) - {device.model}")
    
    print(f"\nСоединения: {len(project.links)}")
    for link in project.links:
        from_device = project.get_device(link.from_device_id)
        to_device = project.get_device(link.to_device_id)
        print(f"  - {from_device.name} -> {to_device.name} ({link.length_meters}м, {link.cable_type})")
    
    # Проверяем проект
    validation = project.validate()
    print(f"\n[OK] Проверка проекта:")
    print(f"  Действителен: {validation['valid']}")
    if validation['errors']:
        print(f"  Ошибки: {validation['errors']}")
    if validation['warnings']:
        print(f"  Предупреждения: {validation['warnings']}")
    
    print("\n" + "=" * 60)
    return project


def example_warehouse():
    """Пример: Система видеонаблюдения для среднего склада"""
    print("=" * 60)
    print("Пример 2: Система видеонаблюдения для среднего склада")
    print("=" * 60)
    
    project = Project(
        name="Warehouse Security System",
        description="Система видеонаблюдения для среднего склада с СКУД"
    )
    
    # Добавляем камеры
    for i in range(1, 6):
        camera = deepcopy(EQUIPMENT_CATALOG["hikvision-4k"])
        camera.name = f"Warehouse-Camera-{i:02d}"
        camera.location = f"Зона {i}"
        project.add_device(camera)
    
    # Коммутаторы
    switch_1 = deepcopy(EQUIPMENT_CATALOG["hikvision-24poe"])
    switch_1.name = "Warehouse-Switch-01"
    project.add_device(switch_1)
    
    # NVR
    nvr = deepcopy(EQUIPMENT_CATALOG["nvr-hikvision-32ch"])
    nvr.name = "Warehouse-NVR-01"
    project.add_device(nvr)
    
    # Контроллер доступа
    access_ctrl = deepcopy(EQUIPMENT_CATALOG["access-hikvision"])
    access_ctrl.name = "Warehouse-Access-01"
    project.add_device(access_ctrl)
    
    # Соединяем камеры со коммутатором
    for i, device in enumerate(project.devices[:5]):
        if device.device_type == "camera":
            link = Link(
                from_device_id=device.id,
                from_port_id=device.ports[0].id,
                to_device_id=switch_1.id,
                to_port_id=switch_1.ports[i].id,
                cable_type=CableType.CAT6,
                length_meters=40 + i*10
            )
            project.add_link(link)
    
    storage.create_project(project)
    
    print(f"\nПроект: {project.name}")
    print(f"Оборудование: {len(project.devices)} устройств")
    print(f"Соединения: {len(project.links)} кабельных трасс")
    
    validation = project.validate()
    print(f"Статус: {'[OK] Валидно' if validation['valid'] else '[ERROR] Ошибки'}")
    print("=" * 60)
    
    return project


if __name__ == "__main__":
    # Запускаем примеры
    office_project = example_small_office()
    print("\n")
    warehouse_project = example_warehouse()
    
    # Показываем список всех проектов
    print("\n" + "=" * 60)
    print("Список всех проектов:")
    print("=" * 60)
    for project in storage.list_projects():
        print(f"- {project.name} ({len(project.devices)} устройств, {len(project.links)} соединений)")
    
    # Показываем доступные шаблоны
    print("\n" + "=" * 60)
    print("Доступные шаблоны решений:")
    print("=" * 60)
    for template in storage.list_templates():
        print(f"- {template.name} ({template.category})")
        print(f"  Требования: {template.requirements}")
    
    print("\n[SUCCESS] Примеры завершены!")
    print(f"\nДля запуска API сервера выполните:")
    print(f"  python run.py")
