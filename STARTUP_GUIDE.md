# 🚀 Запуск PSS Builder

## Быстрый старт

### Вариант 1: Python скрипт (рекомендуется - самый надежный)
```bash
python start_all.py
```

### Вариант 2: Батник (только Windows)
```bash
start_all.bat
```

Просто дважды кликните на файл или запустите в командной строке.

### Вариант 3: PowerShell (если остальное не работает)
```powershell
.\START.ps1
```

---

## 📍 После запуска

**Откройте в браузере:**
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- API документация: http://127.0.0.1:8000/docs

---

## ❌ Если ничего не работает

### Python скрипт упал?
- Проверьте что установлены Python и Node.js: `python --version` и `node --version`
- Используйте батник или PowerShell вариант

### Батник упал?
- Запустите его от администратора (правый клик → "Запустить от администратора")
- Используйте Python скрипт

### PowerShell упал?
- Может быть блокирован. Выполните:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- Потом `.\START.ps1`

---

## 🛠️ Ручной старт если все упало

**Терминал 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 💡 Почему скрипты нужны?

- **start_all.py** - Универсальный Python скрипт, работает везде
- **start_all.bat** - Простой батник для Windows, самый быстрый
- **START.ps1** - PowerShell вариант, может быть заблокирован политикой безопасности

Используйте скрипт, который работает на вашей системе! 🎯
