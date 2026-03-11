# PSS Builder - Project Startup Guide

## 🚀 Quick Start (Choose One)

### Option 1: Windows PowerShell (Recommended)
```bash
# Make script executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run startup script
.\START.ps1
```

### Option 2: Linux/macOS
```bash
chmod +x start.sh
./start.sh
```

### Option 3: Manual Startup

#### Terminal 1 - Backend
```bash
cd backend
python -m venv venv                    # Create virtual env (first time only)
.\venv\Scripts\Activate                # Windows
# OR
source venv/bin/activate               # Linux/macOS

pip install fastapi uvicorn pydantic   # First time only
python -m uvicorn app.main:app --reload
```

Server runs on: **http://127.0.0.1:8000**

#### Terminal 2 - Frontend
```bash
cd frontend
npm install                            # First time only
npm run dev
```

Server runs on: **http://localhost:3000**

---

## 📋 Prerequisites

- **Python 3.10+** - [Download Python](https://www.python.org/)
- **Node.js 18+** - [Download Node](https://nodejs.org/)
- **Git** (Optional) - [Download Git](https://git-scm.com/)

### Check Installation
```bash
python --version      # Should show 3.10+
node --version       # Should show 18+
npm --version        # Should show 8+
```

---

## 🎯 First Time Setup

### 1. Install Backend Dependencies
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate        # Windows
# OR
source venv/bin/activate        # Linux/macOS

pip install -r requirements.txt
```

### 2. Start Backend
```bash
python -m uvicorn app.main:app --reload
```

✅ Backend ready at: http://127.0.0.1:8000

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. Start Frontend
```bash
npm run dev
```

✅ Frontend ready at: http://localhost:3000

---

## 🎮 Using the Application

### Create a Project
1. Open http://localhost:3000
2. Click **"New Project"**
3. Enter name and description
4. Confirm to create

### Add Devices
1. Browse **Equipment Library** on left
2. Search or filter by type
3. Click **+** button or drag to canvas
4. Device appears on canvas

### Connect Devices
1. Hover over device **ports** (circles on edges)
2. Click and drag to connect to another port
3. Set **cable type** and **length** in properties
4. Connection appears as a line on canvas

### Validate Project
1. Click **Validate** button in toolbar
2. Review errors/warnings in right panel
3. Fix issues by adjusting architecture
4. Status shows **Valid** when ready

### Save Project
1. Make changes to your project
2. Click **Save** button
3. Project syncs to backend

---

## 📚 Where to Go Next

### Frontend
- **Start Frontend:** http://localhost:3000
- **Frontend README:** `frontend/README.md`
- **Development Guide:** `frontend/DEVELOPMENT.md`
- **React Flow Docs:** https://reactflow.dev/

### Backend
- **API Documentation:** http://127.0.0.1:8000/docs (Swagger UI)
- **Backend README:** `backend/README.md`
- **FastAPI Docs:** https://fastapi.tiangolo.com/

### Project
- **Backend Manifest:** `backend_manifest.txt`
- **Frontend Manifest:** `frontend_manifest.txt`
- **Full Architecture:** `ARCHITECTURE.md` (if exists)

---

## 🔧 Troubleshooting

### Port Already in Use
**Error:** `Address already in use`

**Solution:**
```bash
# Find process on port 8000 (backend)
lsof -i :8000          # Linux/macOS
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess  # Windows

# Find process on port 3000 (frontend)
lsof -i :3000          # Linux/macOS
```

Then kill the process or change port in config.

### Backend Not Responding
**Error:** `Cannot GET /api/...`

**Checks:**
1. Backend running? See: http://127.0.0.1:8000/docs
2. Frontend proxy config? Check `frontend/vite.config.ts`
3. CORS enabled? Backend has CORS middleware

### Frontend Won't Start
**Error:** `Module not found` or `npm ERR!`

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Python Virtual Environment Issues
**Error:** `command not found: python` or `No module named ...`

**Solution:**
```bash
# Recreate venv
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate    # Linux/macOS
pip install fastapi uvicorn pydantic sqlalchemy
```

---

## 📊 Project Structure

```
PSS builder/
├── backend/                    ← FastAPI server
│   ├── app/
│   │   ├── models/            ← Data models
│   │   ├── api/               ← REST endpoints
│   │   ├── equipment_catalog.py
│   │   └── main.py            ← FastAPI app
│   ├── venv/                  ← Python environment
│   └── main.py (or wsgi.py)   ← Entry point
│
├── frontend/                   ← React app
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/           ← UI components
│   │   ├── shared/            ← API, store
│   │   └── styles/
│   ├── node_modules/          ← npm packages
│   ├── package.json
│   └── vite.config.ts
│
├── backend_manifest.txt       ← Backend spec
├── frontend_manifest.txt      ← Frontend spec
├── START.ps1                  ← Windows startup
├── start.sh                   ← Linux/macOS startup
└── SETUP.md                   ← This file

```

---

## 🚀 Development Workflow

### Making Changes

**Backend Changes:**
```bash
cd backend
# Edit files in app/
# Server auto-reloads with --reload flag
# Check http://127.0.0.1:8000/docs for changes
```

**Frontend Changes:**
```bash
cd frontend
# Edit files in src/
# Vite auto-refreshes browser
# Open http://localhost:3000
```

### Building for Production

**Backend:**
```bash
# Not needed for FastAPI, just deploy with Gunicorn/Uvicorn
gunicorn app.main:app -w 4
```

**Frontend:**
```bash
cd frontend
npm run build          # Creates dist/ folder
npm run preview        # Preview production build
```

---

## 📈 Performance Tips

- **Backend:** Use `--reload` only in development, remove for production
- **Frontend:** Vite HMR enabled, rebuilds fast on save
- **Both:** Keep devtools open to watch network requests

---

## 🐛 Logs & Debugging

### Backend Logs
```
Check Uvicorn terminal for:
- Request logs (GET/POST/DELETE)
- Error messages
- Validation failures
```

### Frontend Logs
```
Browser Console (F12):
- React component warnings
- API call success/failure
- Error stack traces
```

### API Testing
```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/projects
```

---

## 📞 Support

Having issues?

1. **Check Prerequisites** - Python 3.10+, Node 18+
2. **Read Error Message** - Usually tells you what's wrong
3. **Check Backend** - Is it running on 8000?
4. **Check Frontend** - Is it running on 3000?
5. **Check Logs** - Terminal output has clues
6. **Review Docs** - frontend/README.md, backend/README.md

---

## ✨ What's Next

- Create your first security system project
- Add multiple zones and devices
- Connect all ports with appropriate cables
- Run validation and fix any issues
- Save your project
- Export configuration (future feature)

---

**Happy building! 🎉**

For more detailed information, see:
- `frontend/DEVELOPMENT.md` - Frontend development guide
- `backend/README.md` - Backend API documentation
- Frontend project: http://localhost:3000
- Backend Swagger: http://127.0.0.1:8000/docs
