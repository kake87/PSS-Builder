# PSS Builder Project Structure

## Backend (Python/FastAPI)
- `backend/app/` - Main application code
  - `models/` - Data models (Device, Port, Link, Cable, Rule, Project, Template)
  - `schemas/` - Pydantic schemas for API requests/responses
  - `api/` - API route handlers
  - `main.py` - FastAPI app initialization
  - `config.py` - Configuration settings
  - `storage.py` - In-memory data storage
  - `equipment_catalog.py` - Pre-configured equipment catalog

## Frontend (React)
- `frontend/public/` - Static files and main HTML
- `frontend/src/` - React components (to be developed)
  - `components/` - React components
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `store/` - State management using Zustand
  - `api/` - API client functions
  - `types/` - TypeScript type definitions

## Root
- `manifest.txt` - Original project manifest
- `README.md` - Project documentation
- `example.py` - Usage examples
- `run.py` - Entry point to run the application
- `.env.example` - Environment variables template

## Installation & Running

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

### Frontend (when developed)
```bash
cd frontend
npm install
npm start
```

### Full application
```bash
python run.py
```

## API Endpoints

See API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Features

1. **Device Catalog** - Pre-configured equipment models
2. **Project Management** - Create, edit, and validate projects
3. **Templates** - Ready-made solutions for common scenarios
4. **Rules** - Automatic validation and compliance checking
5. **API-First** - All functionality exposed through REST API

## Development Status

✅ Core data models
✅ API implementation
✅ Equipment catalog
✅ Template system
✅ Validation rules
🔄 Frontend (in progress)
⏳ AI mode (planned)
⏳ Database integration (planned)
