# 📚 PSS Builder - Documentation Index

**Complete Guide to Security Systems Architecture Constructor**

---

## 🆕 **START HERE** - First Time Users

### Quick Path (5 minutes)
1. **[SETUP.md](./SETUP.md)** - Installation & first run
2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - What this project does
3. Run the startup script: `.\START.ps1` (Windows) or `./start.sh` (Linux)
4. Open http://localhost:3000

### Understanding the Project (15 minutes)
1. Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Full feature overview
2. Skim [ARCHITECTURE.md](./ARCHITECTURE.md) - System design overview
3. Check [backend_manifest.txt](./backend_manifest.txt) - What backend does
4. Check [frontend_manifest.txt](./frontend_manifest.txt) - What frontend does

---

## 📖 Core Documentation

### 1. **[SETUP.md](./SETUP.md)** - Installation & Troubleshooting
**Read first if:** You're running the project
- System requirements
- Step-by-step installation
- Common troubleshooting
- Startup scripts (PowerShell & Bash)
- Development workflow

### 2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Project Summary
**Read first if:** You want to understand the big picture
- Quick description & features
- Tech stack
- 30-second system architecture
- Core workflows
- SVN checklist & roadmap

### 3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed System Design
**Read if:** You need deep technical understanding
- Complete system architecture diagram
- Data flow documentation
- Frontend folder structure (detailed)
- Backend folder structure (detailed)
- Database schema (v0.2+)
- API contract examples
- Integration points
- Deployment architecture

### 4. **[frontend/README.md](./frontend/README.md)** - Frontend Overview
**Read if:** You're working on frontend
- Frontend features & capabilities
- Component listing
- Tech stack (React, TypeScript, React Flow, etc.)
- Building & running frontend
- Performance notes

### 5. **[frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)** - Frontend Dev Guide
**Read if:** You're editing frontend code
- Component structure & patterns
- State management (Zustand store)
- API client usage
- Adding new features
- Common patterns & best practices

### 6. **[backend/README.md](./backend/README.md)** - Backend Overview
**Read if:** You're working on backend
- Backend features & capabilities
- Equipment catalog (11 models)
- Template system (4 templates)
- Validation rules (5 rules)
- Running backend
- API documentation links

---

## 📋 Specification Documents

### **[backend_manifest.txt](./backend_manifest.txt)** - Backend Requirements
Complete specifications for backend system:
- API endpoint definitions
- Data model specifications
- Equipment catalog details
- Template definitions
- Validation rule specifications
- Performance requirements

### **[frontend_manifest.txt](./frontend_manifest.txt)** - Frontend Requirements
Complete specifications for frontend:
- UI component requirements
- Feature checklist
- Data model details
- User workflows
- Integration specifications

### **[manifest.txt](./manifest.txt)** - Original Project Manifest
Initial project specification from user request

---

## 🚀 Getting Started Paths

### **Path 1: I Want to Run the Project** (5 min)
1. [SETUP.md](./SETUP.md) - Quick Start section
2. Run appropriate script:
   - **Windows:** `.\START.ps1`
   - **Linux/macOS:** `./start.sh`
3. Open http://localhost:3000

### **Path 2: I Want to Understand the Code** (30 min)
1. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - High level overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. Browse backend/app/ folder
4. Browse frontend/src/ folder
5. Read inline code comments

### **Path 3: I Want to Edit Backend Code** (1 hour)
1. Read [backend_manifest.txt](./backend_manifest.txt)
2. Read [backend/README.md](./backend/README.md)
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) "Backend Detailed Structure"
4. Review `backend/app/models/*.py` for data models
5. Review `backend/app/api/*.py` for endpoints
6. Make changes & test with Swagger UI

### **Path 4: I Want to Edit Frontend Code** (1 hour)
1. Read [frontend_manifest.txt](./frontend_manifest.txt)
2. Read [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) "Frontend Detailed Structure"
4. Review `frontend/src/widgets/*.tsx` for components
5. Review `frontend/src/shared/store/projectStore.ts` for state
6. Make changes & hot-reload will appear in browser

### **Path 5: I Want to Deploy to Production**
1. [SETUP.md](./SETUP.md) - Production Build section
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Deployment Architecture section
3. Follow backend deployment instructions
4. Follow frontend build instructions

### **Path 6: I Found a Bug** (Debug)
1. [SETUP.md](./SETUP.md) - Troubleshooting section
2. Check browser console (F12 DevTools)
3. Check terminal/server logs
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - Data Flow section
5. Locate the component/endpoint in code
6. Add console.log or debugger statements
7. Test changes

### **Path 7: I Want to Add a New Feature** (2-4 hours)
1. Check [backend_manifest.txt](./backend_manifest.txt) & [frontend_manifest.txt](./frontend_manifest.txt)
2. Identify if backend API change needed
3. If backend: Add to `backend/app/api/*.py`
4. If frontend: Add component to `frontend/src/widgets/`
5. Update Zustand store if needed
6. Update API client if needed
7. Test locally

---

## 🗂️ Document Structure

```
Root Documentation
├── THIS FILE (INDEX.md) - What you're reading now
├── SETUP.md - How to install and run
├── PROJECT_OVERVIEW.md - What this project does
├── ARCHITECTURE.md - How the system works
├── backend_manifest.txt - Backend specifications
├── frontend_manifest.txt - Frontend specifications
└── manifest.txt - Original requirements

Frontend Documentation
├── frontend/README.md - Frontend features
├── frontend/DEVELOPMENT.md - Frontend dev guide
├── frontend/FRONTEND_REPORT.md - Completion report
└── frontend/SETUP.md - Frontend setup

Backend Documentation
├── backend/README.md - Backend features
└── backend/example.py - Usage examples

Scripts
├── START.ps1 - Windows startup
└── start.sh - Linux/macOS startup
```

---

## 🎯 Quick Reference

### Common Tasks

| I want to... | Read | Command |
|----------|------|---------|
| Run the app | [SETUP.md](./SETUP.md) | `.\START.ps1` or `./start.sh` |
| See API docs | [ARCHITECTURE.md](./ARCHITECTURE.md) | Visit http://127.0.0.1:8000/docs |
| Start dev server | [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md) | `npm run dev` |
| Build frontend | [frontend/README.md](./frontend/README.md) | `npm run build` |
| Start backend | [backend/README.md](./backend/README.md) | `python -m uvicorn app.main:app --reload` |
| See architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) | Read full document |
| Find API endpoint | [backend/README.md](./backend/README.md) | See API section |
| Understand component | [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md) | See component patterns |
| Fix something | [SETUP.md - Troubleshooting](./SETUP.md) | Check solutions |

### Important Files

| File | Size | Purpose |
|------|------|---------|
| [SETUP.md](./SETUP.md) | 5 min read | Installation guide |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | 10 min read | Project summary |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 30 min read | System design |
| [backend/README.md](./backend/README.md) | 5 min read | Backend features |
| [frontend/README.md](./frontend/README.md) | 5 min read | Frontend features |
| [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md) | 15 min read | Dev patterns |

### URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend app |
| http://127.0.0.1:8000 | Backend API |
| http://127.0.0.1:8000/docs | Swagger UI (API interactive docs) |
| http://127.0.0.1:8000/redoc | ReDoc (API alternative format) |
| http://127.0.0.1:8000/health | Health check endpoint |

---

## 🔍 Finding Things

### Finding an API Endpoint
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) "API Contract Examples"
2. Or visit http://127.0.0.1:8000/docs while backend is running
3. Or search `backend/app/api/` files

### Finding a Frontend Component
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) "Frontend Detailed Structure"
2. Or check `frontend/src/widgets/` folder
3. Or read [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)

### Finding Backend Logic
1. Check [backend_manifest.txt](./backend_manifest.txt)
2. Or check `backend/app/api/` for routes
3. Or check `backend/app/models/` for data models
4. Or check `backend/storage.py` for data access

### Finding Configuration
1. **Frontend:** `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tailwind.config.js`
2. **Backend:** `backend/app/main.py` for FastAPI config
3. **Environment:** `.env.example` file

---

## 📊 System Components at a Glance

| Component | Tech | Purpose | Location |
|-----------|------|---------|----------|
| **Frontend App** | React 18 + TypeScript | User interface | `frontend/src/` |
| **Node Editor** | React Flow | Canvas with nodes | `frontend/src/widgets/Canvas.tsx` |
| **State Management** | Zustand | Global app state | `frontend/src/shared/store/` |
| **API Client** | Axios | Backend communication | `frontend/src/shared/api/` |
| **Backend API** | FastAPI | REST endpoints | `backend/app/api/` |
| **Data Models** | Pydantic | Type definitions | `backend/app/models/` |
| **Data Storage** | In-Memory | Temporary store | `backend/storage.py` |
| **Equipment Catalog** | Python dict | Device definitions | `backend/equipment_catalog.py` |
| **Validation Rules** | Python functions | Business logic | `backend/app/models/project.py` |

---

## ✅ Validation Checklist

**Before you start development, ensure:**

- [ ] Python 3.10+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Backend starts without errors (`python -m uvicorn app.main:app --reload`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Browser opens http://localhost:3000
- [ ] API responds at http://127.0.0.1:8000/docs

---

## 🆘 Help & Support

### Troubleshooting
- See [SETUP.md - Troubleshooting](./SETUP.md#-troubleshooting)
- Check browser console errors (F12)
- Check terminal output for error messages

### Common Issues & Solutions
1. **Port already in use** → [SETUP.md](./SETUP.md#port-already-in-use)
2. **Backend won't start** → [SETUP.md](./SETUP.md#backend-wont-start)
3. **Frontend won't start** → [SETUP.md](./SETUP.md#frontend-wont-start)
4. **API connection error** → [SETUP.md](./SETUP.md#api-connection-errors)

### Getting Help
1. Read the relevant document from the index above
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system context
3. Review inline code comments
4. Check error messages carefully

---

## 📈 Document Recommendations

### By Role

**Backend Developer**
- Start: [SETUP.md](./SETUP.md), [backend/README.md](./backend/README.md)
- Main: [backend_manifest.txt](./backend_manifest.txt), [ARCHITECTURE.md](./ARCHITECTURE.md)
- Reference: [backend/example.py](./backend/example.py)

**Frontend Developer**
- Start: [SETUP.md](./SETUP.md), [frontend/README.md](./frontend/README.md)
- Main: [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md), [frontend_manifest.txt](./frontend_manifest.txt)
- Reference: [frontend/src/widgets/](./frontend/src/widgets/)

**Full Stack Developer**
- Start: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md), [SETUP.md](./SETUP.md)
- Main: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Reference: Both backend & frontend docs

**DevOps/Deployment**
- Start: [SETUP.md](./SETUP.md)
- Main: [ARCHITECTURE.md](./ARCHITECTURE.md) Deployment section
- Reference: [SETUP.md](./SETUP.md) Production Build

**Product Owner**
- Start: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- Reference: [backend_manifest.txt](./backend_manifest.txt), [frontend_manifest.txt](./frontend_manifest.txt)

---

## 🎓 Reading Guide by Topic

### Understanding the Architecture
1. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Quick overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed design
3. Browse code in `backend/app/` and `frontend/src/`

### Setting Up Development
1. [SETUP.md](./SETUP.md) - Installation steps
2. [SETUP.md](./SETUP.md) - Development workflow
3. Try making a small change

### Adding a Feature
1. Identify scope (backend, frontend, or both)
2. Check specifications: [backend_manifest.txt](./backend_manifest.txt) or [frontend_manifest.txt](./frontend_manifest.txt)
3. Read relevant development guide
4. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for integration points
5. Implement changes
6. Test thoroughly

### Deploying
1. [SETUP.md](./SETUP.md) - Production build section
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Deployment architecture
3. Follow deployment checklist

---

## 📝 Notes for Different Scenarios

### **Scenario: "I just forked/cloned the project"**
1. Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) (5 min)
2. Run [SETUP.md](./SETUP.md) quick start (5 min)
3. Explore the running app (10 min)
4. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand design (20 min)

### **Scenario: "I want to fix a bug"**
1. Identify if it's frontend or backend
2. Check relevant logs (browser console or server terminal)
3. Find the component/route in code
4. Read related code section
5. Use browser DevTools or Python debugger
6. Make a minimal fix
7. Test thoroughly

### **Scenario: "I want to add a new equipment type"**
1. Check [backend_manifest.txt](./backend_manifest.txt) equipment section
2. Read [backend/equipment_catalog.py](./backend/equipment_catalog.py)
3. Add new equipment to the catalog
4. Test via API docs
5. Frontend will automatically see it in Equipment Library

### **Scenario: "I want to understand how validation works"**
1. Check [backend_manifest.txt](./backend_manifest.txt) validation rules
2. Read [backend/app/models/project.py](./backend/app/models/project.py) - `validate()` method
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) "Validate Project Flow"
4. Test in browser with sample project

---

## 🎯 Quick Links Summary

```
INSTALLATION        → SETUP.md
PROJECT OVERVIEW    → PROJECT_OVERVIEW.md
SYSTEM DESIGN       → ARCHITECTURE.md
BACKEND SPEC        → backend_manifest.txt
FRONTEND SPEC       → frontend_manifest.txt
BACKEND INFO        → backend/README.md
FRONTEND INFO       → frontend/README.md
FRONTEND DEV        → frontend/DEVELOPMENT.md
```

---

## 🚀 Next Step

**Based on what you want to do:**

1. ✨ **Run the app** → [SETUP.md](./SETUP.md)
2. 📚 **Understand it** → [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
3. 🏗️ **Deep dive** → [ARCHITECTURE.md](./ARCHITECTURE.md)
4. 💻 **Edit backend** → [backend/README.md](./backend/README.md)
5. 🎨 **Edit frontend** → [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)
6. 🐛 **Fix issues** → [SETUP.md - Troubleshooting](./SETUP.md#-troubleshooting)

---

**Document Version:** 1.0  
**Last Updated:** March 7, 2026  
**Total Documentation:** 8 comprehensive guides

💡 **Pro Tip:** Bookmark this page for quick reference!
