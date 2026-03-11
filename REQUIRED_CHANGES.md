# 📋 Манифест Требуемых Изменений PSS Builder Frontend

**Статус:** Активная разработка  
**Приоритет:** Критический → Высокий → Средний  
**Дата создания:** 7 марта 2026  

---

## 🔴 ФАЗА 0: КРИТИЧЕСКИЕ БАГИ (ДЕНЬ 1 - 2-3 часа)

### 1. ❌ FIX: Drag-and-Drop на Canvas (1-2 часа)

**Проблема:**
- Drag-and-drop работает только в Properties Panel
- На canvas перетягивание не срабатывает
- Структура DOM может перехватывать события

**Файлы:** `frontend/src/widgets/Canvas.tsx`

**Требуется:**
- [ ] Проверить z-index и pointer-events CSS
- [ ] Убедиться что `reactFlowWrapper` имеет правильный drop handler
- [ ] Проверить что `event.preventDefault()` вызывается
- [ ] Добавить console.log для дебагинга
- [ ] Тест: Перетягивание работает на любой части canvas

**Дефект будет исправлен когда:**
```
✅ Можно перетягивать оборудование из Equipment Library на canvas
✅ Устройство появляется в месте drop-а
✅ Множество перетягиваний работают подряд
```

---

### 2. ❌ FIX: Add Button в EquipmentLibrary (30 мин)

**Проблема:**
- Кнопка плюсик (Add) не работает
- Нет onClick handler
- Нет проверки projectId

**Файлы:** `frontend/src/widgets/EquipmentLibrary.tsx`

**Требуется:**
- [ ] Найти кнопку с плюсиком/Add
- [ ] Привязать `onClick={(e) => onAddDevice(equipment.key)}`
- [ ] Добавить проверку: `if (!projectId) { toast error; return; }`
- [ ] Добавить error handling
- [ ] Тест: Клик на плюс добавляет оборудование

**Дефект будет исправлен когда:**
```
✅ Клик на кнопку + добавляет оборудование на canvas
✅ Показывается error если нет проекта
✅ Кнопка работает несколько раз подряд
```

---

## 🔴 ФАЗА 1: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (ДЕНЬ 1 - 3-4 часа)

### 3. ❌ FIX: Валидация Проекта (2 часа)

**Проблема:**
- Кнопка "Validate" ничего не делает
- ValidationPanel не показывает результаты
- Нет real-time валидации
- Нет подсветки ошибок на canvas

**Файлы:** 
- `frontend/src/pages/PSSBuilder.tsx` (validateMutation)
- `frontend/src/widgets/ValidationPanel.tsx`
- `frontend/src/widgets/Canvas.tsx` (highlighting)

**Требуется:**
- [ ] Сделать validateMutation правильно вызываемой
- [ ] Убедиться что `res.data.errors` и `res.data.warnings` получаются
- [ ] Показать результаты в ValidationPanel
- [ ] Подсветить ошибочные элементы на canvas (красная граница)
- [ ] Показать детальное сообщение ошибки (не просто "Ошибка")
- [ ] Добавить real-time валидацию при изменении
- [ ] Клик на ошибку = выделение элемента

**Дефект будет исправлен когда:**
```
✅ Нажимаете Validate - видите результаты в ValidationPanel
✅ Элементы с ошибками выделены на canvas
✅ Ошибки имеют детальное описание
✅ Клик на ошибку выделяет элемент
✅ Валидация работает автоматически при изменении
```

---

### 4. ❌ FEATURE: Delete/Duplicate/Copy-Paste (1.5 часа)

**Проблема:**
- Нельзя удалить устройство
- Нельзя продублировать
- Нельзя копировать/вставлять

**Файлы:**
- `frontend/src/widgets/Canvas.tsx` (handlers)
- `frontend/src/pages/PSSBuilder.tsx` (store integration)
- `frontend/src/shared/store/projectStore.ts` (store methods)

**Требуется:**
- [ ] **DELETE:** Клавиша Delete удаляет выбранный элемент/связь
- [ ] **DUPLICATE:** Ctrl+D дублирует выбранный элемент (со смещением)
- [ ] **COPY/PASTE:** Ctrl+C копирует, Ctrl+V вставляет
- [ ] **КОНТЕКСТНОЕ МЕНЮ:** Правый клик → Delete, Duplicate, Copy, Paste
- [ ] Тесты на все операции

**Дефект будет исправлен когда:**
```
✅ Выбираем элемент, нажимаем Delete - исчезает
✅ Ctrl+D создает копию со смещением
✅ Ctrl+C/V копирует часть архитектуры
✅ Правый клик показывает меню
✅ Все операции работают с элементами и связями
```

---

### 5. ❌ FEATURE: Контекстное Меню (1 час)

**Проблема:**
- Нет контекстного меню при правом клике
- Нет быстрого доступа к операциям

**Файлы:**
- `frontend/src/widgets/Canvas.tsx` (onContextMenu)
- `Новый файл: frontend/src/widgets/ContextMenu.tsx`

**Требуется:**
- [ ] Создать ContextMenu компонент
- [ ] Добавить onContextMenu handler на Canvas
- [ ] Меню должно включать:
  - Delete
  - Duplicate
  - Copy
  - Paste
  - Rename
  - View Properties
  - Add to Group

**Дефект будет исправлен когда:**
```
✅ Правый клик на элемент показывает меню
✅ Каждый пункт работает (Delete, Duplicate и т.д.)
✅ Меню позиционируется правильно
✅ Клик вне меню закрывает его
```

---

## 🟠 ФАЗА 2: УЛУЧШЕНИЯ UX (ДЕНЬ 2-3 - 6-7 часов)

### 6. ❌ FEATURE: Метки на Связи (3 часа)

**Проблема:**
- Связи между портами неинформативны
- Нет видимости типа кабеля и длины
- Нет подсказки при наведении

**Файлы:**
- `frontend/src/widgets/Canvas.tsx` (Edge labels)
- Новый компонент для Edge

**Требуется:**
- [ ] На каждую связь добавить Label с:
  - Типом кабеля (CAT5e, CAT6, Optical и т.д.)
  - Длиной кабеля (м)
  - Пропускной способностью (Mbps)
- [ ] Label появляется при наведении на линию
- [ ] При клике на линию открывается Properties с полной информацией
- [ ] Цветовая кодировка линий (зеленая = OK, красная = ошибка)

**Дефект будет исправлен когда:**
```
✅ Наводите на линию - видите тип кабеля и длину
✅ Клик на линию показывает все Specifications
✅ Ошибочные линии выделены другим цветом
✅ Label показывает bandwidth information
```

---

### 7. ❌ FEATURE: Улучшить DeviceNode Визуально (4 часа)

**Проблема:**
- Node выглядит как кнопка UI, а не как оборудование
- Порты равномерно расположены только слева
- Нет информации о параметрах (модель, производитель, питание)
- Нет реалистичного дизайна

**Файлы:** `frontend/src/widgets/DeviceNode.tsx`

**Требуется:**
- [ ] **Реалистичный дизайн:**
  - Похоже на rack-mount оборудование
  - Заголовок с иконкой типа устройства
  - Модель, производитель, модель
  - Статус питания/активности
  
- [ ] **Правильное расположение портов:**
  - Сверху, слева, справа (не только слева)
  - Подписи на каждом порту
  - Цветовая кодировка портов по типам:
    - 🔵 Ethernet = Blue
    - 🟠 PoE = Orange  
    - 🟢 Serial = Green
    - 🔴 Power = Red
  
- [ ] **Информационность:**
  - Показать потребление мощности (ватты)
  - Показать разрешение (для камер)
  - Показать статус устройства

**Дефект будет исправлен когда:**
```
✅ Node выглядит как professional equipment, не как кнопка
✅ Порты расположены реалистично (сверху/слева/справа)
✅ Портты имеют подписи и цветовую кодировку
✅ Видна модель, производитель, параметры
✅ На каждый тип порта свой цвет
```

---

### 8. ❌ FEATURE: Dashboard с Метриками (3 часа)

**Проблема:**
- Инженер не видит целостный статус проекта
- Нет информации о мощности, полосе, стоимости
- Нет индикатора "готовности" системы

**Файлы:**
- Новый компонент: `frontend/src/widgets/Dashboard.tsx`
- `frontend/src/pages/PSSBuilder.tsx` (добавить Dashboard)

**Требуется:**
- [ ] Создать Dashboard с метриками:
  ```
  Всего устройств: 12
  Общее потребление: 1,250 W
  Требуемая полоса: 45 Mbps
  Хранилище: 2,000 GB
  Примерная стоимость: $15,000
  ```
  
- [ ] Предупреждения о пересчетах:
  ```
  ⚠️ Превышено потребление мощности (1250W > 1000W)
  ⚠️ Недостаточна полоса (45Mbps > 40Mbps)
  ```
  
- [ ] Индикатор готовности:
  ```
  ✅ Система готова к развертыванию
  ⚠️ Требуется 3 исправления
  ❌ Критические ошибки
  ```

**Дефект будет исправлен когда:**
```
✅ Dashboard показывает все метрики проекта
✅ Предупреждения появляются при превышении лимитов
✅ Статус "готовности" обновляется в реальном времени
✅ Можно видеть стоимость и требования к ресурсам
```

---

## 🟡 ФАЗА 3: УЛУЧШЕНИЯ ИНТЕРФЕЙСА (ДЕНЬ 3-4 - 4-5 часов)

### 9. ❌ FEATURE: Group/Zones (2 часа)

**Проблема:**
- Нельзя группировать элементы
- Нет зон/разделов в проекте
- Множество элементов невозможно управлять

**Файлы:**
- Новый компонент: `frontend/src/widgets/GroupPanel.tsx`
- `frontend/src/shared/store/projectStore.ts` (store methods)
- `frontend/src/widgets/Canvas.tsx` (rendering)

**Требуется:**
- [ ] Выделить несколько элементов (Shift+Click или Ctrl+Click)
- [ ] Группировать в один Group (Ctrl+G)
- [ ] Показать/скрыть Group
- [ ] Коллапсировать/расширить Group
- [ ] Tree View для навигации

**Дефект будет исправлен когда:**
```
✅ Можно выделить несколько элементов
✅ Ctrl+G создает Group с выделенными элементами
✅ Group можно коллапсировать
✅ Tree View показывает иерархию
```

---

### 10. ❌ FEATURE: Undo/Redo (1.5 часа)

**Проблема:**
- Нет отката последнего действия
- Одна ошибка = переделывать всё

**Файлы:**
- `frontend/src/shared/store/projectStore.ts` (history management)
- `frontend/src/widgets/Toolbar.tsx` (buttons)

**Требуется:**
- [ ] Сохранять историю действий (store-level)
- [ ] Ctrl+Z = Undo
- [ ] Ctrl+Y или Ctrl+Shift+Z = Redo
- [ ] Кнопки Undo/Redo в Toolbar
- [ ] Ограничить историю до 50 действий

**Дефект будет исправлен когда:**
```
✅ Ctrl+Z отменяет последнее действие
✅ Ctrl+Y повторяет отменное действие
✅ Undo/Redo кнопки в toolbar работают
✅ История сохраняется между действиями
```

---

### 11. ❌ FEATURE: Горячие Клавиши (1 час)

**Проблема:**
- Нет документированых горячих клавиш
- Нельзя работать быстро

**Файлы:**
- Новый компонент: `frontend/src/widgets/KeyboardShortcuts.tsx`
- `frontend/src/widgets/Canvas.tsx` (handlers)

**Требуется:**
- [ ] Создать KeyboardShortcuts component с описанием
- [ ] Добавить горячие клавиши:
  ```
  Del = Delete selected
  Ctrl+D = Duplicate
  Ctrl+C/V = Copy/Paste
  Ctrl+Z = Undo
  Ctrl+Y = Redo
  Ctrl+F = Find
  Ctrl+G = Group
  Space = Auto-layout
  ```
- [ ] Показывать подсказку при первом запуске
- [ ] Клавиша F1 = Show shortcuts

**Дефект будет исправлен когда:**
```
✅ Все горячие клавиши работают
✅ F1 показывает справку
✅ Используя горячие клавиши работать быстрее
```

---

## 🟡 ФАЗА 4: ВИЗУАЛЬНАЯ ПОЛИРОВКА (1-2 дня - 3-4 часа)

### 12. ❌ FEATURE: Визуальные Эффекты и Feedback (2 часа)

**Проблема:**
- Нет hover эффектов
- Нет анимаций
- Нет уведомлений пользователю
- Нет loading indicators

**Файлы:**
- `frontend/src/**/*.tsx` (all components)
- Новый компонент: `frontend/src/widgets/Toast.tsx`

**Требуется:**
- [ ] **Hover Effects:**
  - Элементы светятся при наведении
  - Кнопки меняют цвет
  - Связи активируются подсветкой
  
- [ ] **Анимации:**
  - Плавное добавление элементов
  - Морфление при перестановке
  - Transition при удалении
  
- [ ] **Уведомления (Toast):**
  - "✅ Устройство добавлено"
  - "✅ Проект сохранен"
  - "❌ Ошибка при соединении"
  - "⚠️ Превышены лимиты"
  
- [ ] **Loading States:**
  - Spinner при загрузке каталога
  - Прогресс при валидации

**Дефект будет исправлен когда:**
```
✅ Все элементы имеют hover эффекты
✅ Анимации smooth и pleasant
✅ Уведомления появляются для каждого действия
✅ Loading states видны при длительных операциях
```

---

### 13. ❌ FEATURE: Help и Guideline (1.5 часа)

**Проблема:**
- Нет встроенной справки
- Нет примеров
- Нет первого запуска туториала

**Файлы:**
- Новый компонент: `frontend/src/widgets/HelpPanel.tsx`
- Новый компонент: `frontend/src/widgets/OnboardingTutorial.tsx`

**Требуется:**
- [ ] **First-time Wizard:**
  - Показывает основные функции
  - Интерактивный тутариал
  
- [ ] **Context Help (F1):**
  - Справка по текущему экрану
  - Примеры использования
  
- [ ] **Tooltips:**
  - На каждой кнопке описание
  - На портах - описание типа
  - На параметрах - объяснение

- [ ] **Status Bar:**
  - Координаты элемента
  - Советы по горячим клавишам
  - Текущее действие

**Дефект будет исправлен когда:**
```
✅ Новый пользователь видит вводный тутарий
✅ F1 показывает справку
✅ На каждый элемент есть tooltip
✅ Status bar показывает полезную информацию
```

---

## 📊 Итоговая Таблица Работ

| # | Задача | Тип | Часы | Статус | Дата |
|---|--------|------|------|--------|------|
| **1** | Fix Drag-and-Drop | Bug | 1-2ч | ⏳ | День 1 |
| **2** | Fix Add Button | Bug | 0.5ч | ⏳ | День 1 |
| **3** | Валидация | Feature | 2ч | ⏳ | День 1 |
| **4** | Delete/Duplicate/Copy | Feature | 1.5ч | ⏳ | День 1 |
| **5** | Контекстное меню | Feature | 1ч | ⏳ | День 1 |
| **6** | Метки на связи | Feature | 3ч | ⏳ | День 2 |
| **7** | DeviceNode дизайн | Feature | 4ч | ⏳ | День 2 |
| **8** | Dashboard | Feature | 3ч | ⏳ | День 2 |
| **9** | Group/Zones | Feature | 2ч | ⏳ | День 3 |
| **10** | Undo/Redo | Feature | 1.5ч | ⏳ | День 3 |
| **11** | Горячие клавиши | Feature | 1ч | ⏳ | День 3 |
| **12** | Визуальные эффекты | Polish | 2ч | ⏳ | День 4 |
| **13** | Help & Guidelines | Polish | 1.5ч | ⏳ | День 4 |

**ВСЕГО:** ~23-25 часов работы (примерно 3-4 дня)

---

## 🚀 Стратегия Разработки

### Синхронизация с Backend
- ✅ Backend имеет все API endpoints готовы
- ✅ Валидация работает на backend
- ✅ Хранилище готово
- ✅ Каталог оборудования полный

### Рекомендуемый Порядок
1. **День 1:** Баги (1-2) + Критические фичи (3-5) = 5 часов
2. **День 2:** UX улучшения (6-8) = 10 часов  
3. **День 3:** Продвинутые (9-11) = 4.5 часа
4. **День 4:** Полировка (12-13) = 3.5 часа

### Тестирование
- После каждой фичи запускать тесты
- Проверять на реальных сценариях
- Собирать feedback от пользователя

---

## ✅ Критерии Завершения

Проект будет считаться завершенным когда:

- ✅ **Все критические баги исправлены** (1-2)
- ✅ **Все критические фичи реализованы** (3-5)
- ✅ **Основной UX улучшен** (6-8)
- ✅ **Тесты пройдены** на всех браузерах
- ✅ **Пользователь может свободно работать** без ошибок
- ✅ **Документация обновлена**

---

*Манифест обновляется по ходу разработки*
---

## PHASE NEXT: Product Improvements Backlog (March 11, 2026)

### A. Smart Connections and Cable Presets
- [x] Add cable type picker on connection create (CAT5e, CAT6, Optical, Serial, Power)
- [x] Show cable type immediately in edge label and edge data
- [x] Add port family compatibility checks before connection creation
- [ ] Add inline warning tooltip near invalid target handle
- [ ] Add editable cable preset after connection in Properties panel

Definition of done:
- Connection is blocked for incompatible port families
- User always selects cable profile before edge is created
- Cable type is visible right after creation

### B. Canvas Navigation Stability
- [x] Remove aggressive auto-fit behavior that recenters/zooms canvas on interactions
- [ ] Add optional "Fit to content" button in toolbar
- [ ] Persist viewport (x, y, zoom) per project

Definition of done:
- Selecting a node/edge does not trigger unexpected zoom/center

### C. Project Portability (Export/Import)
- [x] Add JSON export from toolbar
- [x] Add JSON import from toolbar
- [x] Restore nodes, edges, groups from imported file
- [ ] Add schema version migration logic for future format updates
- [ ] Add import validation report with per-item errors

Definition of done:
- User can export, share, and import architecture without manual rebuild
- Invalid JSON import shows user-friendly error

### D. Visual Node/Port Usability
- [x] Increase practical connect target area (`connectionRadius`)
- [x] Increase connector visual size for easier drag
- [ ] Add port hover preview (type + speed + power)
- [ ] Add optional compact node mode for dense projects

Definition of done:
- Ports are easy to grab and connect on desktop and laptop touchpad

### E. Catalog/Typology and Icon Policy
- [ ] Introduce normalized catalog layers: `equipment_type`, `equipment_model`, `compatibility_rule`
- [ ] Add required fields matrix per equipment type (camera, nvr, switch, ups, gateway, access controller)
- [ ] Add record lifecycle status: `draft`, `verified`, `deprecated`
- [ ] Add versioned schema for catalog entries
- [x] Add node display mode with icon optionality (`icon`, `icon+type`, `type-only`)
- [ ] Add icon packs and project-level icon pack switch
- [ ] Add fallback to type badge when icon is unavailable

Definition of done:
- Catalog can be expanded without breaking existing projects
- Device visuals remain informative even when icons are disabled

Progress update (March 11, 2026):
- [x] Added normalized catalog API contract:
  - `/api/equipment-catalog/types`
  - `/api/equipment-catalog/models`
  - `/api/equipment-catalog/compatibility-rules`
  - `/api/equipment-catalog/normalized`
- [x] Added frontend client types/methods for normalized catalog endpoints
- [ ] Persist normalized catalog in dedicated DB tables (currently generated from in-memory catalog)
