# PSS Builder - Complete Architecture

## 📊 System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     CLIENT TIER (Port 3000)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React 18 + TypeScript App                   │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐     │  │
│  │  │  Equipment  │  │ Canvas   │  │ Properties      │     │  │
│  │  │  Library    │  │ (React   │  │ Panel           │     │  │
│  │  │             │  │  Flow)   │  │                 │     │  │
│  │  └─────────────┘  └──────────┘  └─────────────────┘     │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Validation Panel  │  Properties Editor         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Toolbar (Save, Validate, Settings)            │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▼ API Calls ▼                        │
├────────────────────────────────────────────────────────────────┤
│          API Gateway / Vite Proxy (http://localhost:3000/api)  │
│                                                                 │
│  All requests to /api/* forwarded to http://localhost:8000/api │
└────────────────────────────────────────────────────────────────┘
                           ▼ HTTP Requests ▼
┌────────────────────────────────────────────────────────────────┐
│               REST API TIER (Port 8000)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FastAPI Server (Uvicorn)                    │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐     │  │
│  │  │ Projects    │  │ Devices  │  │ Templates       │     │  │
│  │  │ Endpoints   │  │ Endpoints│  │ Endpoints       │     │  │
│  │  └─────────────┘  └──────────┘  └─────────────────┘     │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ Rules        │  │ Equipment Catalog                │  │  │
│  │  │ Endpoints    │  │ (11 pre-configured models)       │  │  │
│  │  └──────────────┘  └──────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Validation Engine                              │    │  │
│  │  │  - Cable length checks                          │    │  │
│  │  │  - PoE budget calculations                      │    │  │
│  │  │  - Port compatibility                           │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▼ Data Access ▼                      │
├────────────────────────────────────────────────────────────────┤
│            DATA TIER (In-Memory v0.1, PostgreSQL v0.2+)        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  InMemoryStorage (Current - v0.1)                        │  │
│  │  - 4 Solution Templates (Office, Warehouse, Store, etc)  │  │
│  │  - 5 Validation Rules                                    │  │
│  │  - Project state (nodes, edges, metadata)                │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  SQLAlchemy + PostgreSQL (v0.2+)                │    │  │
│  │  │  - Device models → devices table                │    │  │
│  │  │  - Project definitions → projects table         │    │  │
│  │  │  - Connections → links table                    │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Frontend Detailed Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── providers.tsx      ← QueryClientProvider
│   │   └── config.ts          ← App configuration
│   │
│   ├── pages/
│   │   └── PSSBuilder.tsx      ← Main application page
│   │       - Project creation modal
│   │       - Project list
│   │       - 3-column layout
│   │
│   ├── widgets/               ← Reusable UI components
│   │   ├── Toolbar.tsx        ← Top navigation
│   │   │   - Save button
│   │   │   - Validate button
│   │   │   - Settings menu
│   │   │
│   │   ├── Canvas.tsx         ← Node diagram editor
│   │   │   - React Flow wrapper
│   │   │   - Pan/Zoom controls
│   │   │   - Mini map
│   │   │   - Background grid
│   │   │
│   │   ├── DeviceNode.tsx     ← Device visualization
│   │   │   - Device name & type
│   │   │   - Status badge (Valid/Warning/Error)
│   │   │   - Port handles for connections
│   │   │   - 3 detail levels (collapsed/normal/expanded)
│   │   │
│   │   ├── EquipmentLibrary.tsx ← Equipment catalog
│   │   │   - Search by name/model/manufacturer
│   │   │   - Filter by category
│   │   │   - Drag & drop to canvas
│   │   │   - Quick add with + button
│   │   │
│   │   ├── PropertiesPanel.tsx ← Device properties
│   │   │   - Edit device name
│   │   │   - View device specs
│   │   │   - Edit port connections
│   │   │   - Cable type selector
│   │   │   - Cable length input
│   │   │
│   │   ├── ValidationPanel.tsx ← Error display
│   │   │   - Error/Warning/Info counts
│   │   │   - Grouped by severity
│   │   │   - Clickable to navigate to device
│   │   │   - Real-time update
│   │   │
│   │   └── AIAssistantPanel.tsx ← Future (v0.2)
│   │       - Text input for prompts
│   │       - Proposed changes diff
│   │       - Apply button
│   │
│   ├── features/              ← Feature modules
│   │   ├── ai/                ← AI assistant feature
│   │   │   ├── hooks.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── export/            ← Export/Import feature
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   │
│   │   └── templates/         ← Template management
│   │       ├── hooks.ts
│   │       └── types.ts
│   │
│   ├── entities/              ← Domain models
│   │   ├── equipment.ts       ← Equipment catalog types
│   │   ├── device.ts          ← Device canvas types
│   │   ├── port.ts            ← Port types
│   │   └── project.ts         ← Project types
│   │
│   ├── shared/
│   │   ├── api/
│   │   │   └── client.ts      ← Axios client
│   │   │       - ProjectsAPI
│   │   │       - DevicesAPI
│   │   │       - TemplatesAPI
│   │   │       - RulesAPI
│   │   │       - All CRUD operations
│   │   │
│   │   ├── store/
│   │   │   └── projectStore.ts ← Zustand store
│   │   │       - Project state
│   │   │       - Node/edge management
│   │   │       - Selection state
│   │   │       - Validation state
│   │   │       - AI proposal state
│   │   │       - UI state (zoom, pan)
│   │   │
│   │   ├── components/        ← Shared components
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   │
│   │   └── utils/
│   │       ├── validators.ts  ← Zod schemas
│   │       ├── formatters.ts
│   │       └── helpers.ts
│   │
│   ├── processes/            ← Business logic
│   │   ├── projectWorkflow.ts
│   │   ├── validation.ts
│   │   └── aiAssistant.ts
│   │
│   ├── styles/
│   │   └── index.css          ← Tailwind + custom CSS
│   │
│   ├── App.tsx               ← Root component
│   └── main.tsx              ← React DOM mount
│
├── public/                   ← Static assets
│
├── index.html               ← HTML template
├── package.json             ← Dependencies
├── tsconfig.json            ← TypeScript config
├── vite.config.ts           ← Build config
├── tailwind.config.js       ← Tailwind theme
├── postcss.config.js        ← PostCSS config
├── .eslintrc.json           ← Linting rules
├── .gitignore               ← Git ignore
├── README.md                ← Frontend docs
└── DEVELOPMENT.md           ← Dev guide
```

---

## 🐍 Backend Detailed Structure

```
backend/
├── app/
│   ├── models/              ← Data models (7 models)
│   │   ├── device.py        ← Device + Port + PortType + DeviceType
│   │   │   - Device class with properties
│   │   │   - PortType enum (power, network, sensor, etc.)
│   │   │   - DeviceType enum (camera, switch, server, etc.)
│   │   │   - Device methods (add_port, get_port)
│   │   │
│   │   ├── link.py          ← Cable connections
│   │   │   - Link class
│   │   │   - CableType enum (CAT5E, CAT6, POWER_WIRE, etc.)
│   │   │   - Connection metadata
│   │   │
│   │   ├── project.py        ← Project container
│   │   │   - Project class
│   │   │   - validate() method with 8-point check
│   │   │   - State management
│   │   │
│   │   ├── rule.py          ← Validation rules
│   │   │   - Rule class
│   │   │   - 5 built-in rules
│   │   │
│   │   ├── template.py       ← Solution templates
│   │   │   - Template class
│   │   │   - 4 pre-built templates
│   │   │
│   │   ├── equipment.py      ← Equipment catalog
│   │   │   - EquipmentModel class
│   │   │
│   │   └── validation.py     ← Validation results
│   │       - ValidationResult class
│   │       - Error/Warning/Info types
│   │
│   ├── api/                 ← REST endpoints (20+ routes)
│   │   ├── projects.py      ← Project endpoints
│   │   │   GET    /api/projects
│   │   │   POST   /api/projects
│   │   │   GET    /api/projects/{id}
│   │   │   POST   /api/projects/{id}/validate
│   │   │   DELETE /api/projects/{id}
│   │   │   PUT    /api/projects/{id}
│   │   │   GET    /api/projects/{id}/export
│   │   │
│   │   ├── devices.py       ← Device endpoints
│   │   │   GET    /api/projects/{id}/devices
│   │   │   POST   /api/projects/{id}/devices
│   │   │   GET    /api/equipment-catalog
│   │   │   POST   /api/projects/{id}/devices-from-template
│   │   │   DELETE /api/projects/{id}/devices/{device_id}
│   │   │
│   │   ├── templates.py      ← Template endpoints
│   │   │   GET    /api/templates
│   │   │   GET    /api/templates/{id}
│   │   │   GET    /api/templates?category=office
│   │   │
│   │   ├── rules.py          ← Rule endpoints
│   │   │   GET    /api/rules
│   │   │   GET    /api/rules?type=cable_length
│   │   │
│   │   └── health.py         ← Health check
│   │       GET    /api/health
│   │       GET    /health
│   │
│   ├── equipment_catalog.py  ← Equipment definitions
│   │   - 11 pre-configured models
│   │   - Hikvision cameras (4K, 2K, etc.)
│   │   - Dahua cameras
│   │   - Cisco switches
│   │   - Dell servers
│   │   - APC UPS
│   │   - ZKTeco access controllers
│   │   - TP-Link access points
│   │
│   ├── storage.py           ← In-memory data store
│   │   - InMemoryStorage class
│   │   - List/Create/Update/Delete operations
│   │   - Template initialization
│   │   - Rule initialization
│   │
│   └── main.py             ← FastAPI app
│       - Application setup
│       - Router configuration
│       - CORS configuration
│       - Uvicorn entry point
│
├── example.py              ← Demo script
│   - 2 working examples
│   - Shows library usage
│   - Validation demonstration
│
├── venv/                   ← Python virtual env
├── requirements.txt        ← Python dependencies
├── .gitignore             ← Git ignore
├── README.md              ← Backend docs
└── main.py (or wsgi.py)   ← Server entry point
```

---

## 🔄 Data Flow Architecture

### CREATE PROJECT Flow

```
1. User clicks "New Project" in UI
                ▼
2. Frontend sends: POST /api/projects
   {
     "name": "Small Office",
     "description": "..."
   }
                ▼
3. Backend receives in projects.py:
   - Creates Project object
   - Stores in InMemoryStorage
   - Returns created project
                ▼
4. Frontend updates Zustand store:
   - Sets projectId
   - Resets nodes/edges
   - Refreshes UI
                ▼
5. Canvas is ready for devices
```

### ADD DEVICE Flow

```
1. User drags equipment from library
                ▼
2. Frontend sends: POST /api/projects/{id}/devices
   {
     "equipment_id": "hikvision_4k",
     "name": "Front Door Camera",
     "position": {x, y}
   }
                ▼
3. Backend:
   - Validates equipment exists
   - Creates Device from template
   - Adds to project
   - Returns device data
                ▼
4. Frontend:
   - Receives device object
   - Adds to React Flow nodes
   - Updates Zustand nodes array
   - Re-renders Canvas
                ▼
5. Device appears on canvas with ports
```

### CONNECT DEVICES Flow

```
1. User draws connection between ports
                ▼
2. React Flow generates connection event
   handle1 → handle2
                ▼
3. Frontend shows cable type/length dialog
                ▼
4. User confirms connection
   Frontend sends: POST /api/projects/{id}/links
   {
     "source_device": "camera_1",
     "source_port": "power",
     "target_device": "switch_1",
     "target_port": "eth_1",
     "cable_type": "CAT6",
     "length_meters": 10
   }
                ▼
5. Backend:
   - Creates Link object
   - Validates compatibility
   - Stores in project
   - Returns updated project
                ▼
6. Frontend:
   - Updates Zustand edges
   - Re-renders connections
   - Updates properties panel
```

### VALIDATE Project Flow

```
1. User clicks "Validate" button
                ▼
2. Frontend sends: POST /api/projects/{id}/validate
                ▼
3. Backend runs validation:
   - Check device count > 0
   - Validate each device
   - Check all ports connected properly
   - Validate cable lengths (max 100m)
   - Check PoE budget
   - Check port compatibility
   - Verify storage capacity
   - Check bandwidth requirements
                ▼
4. Backend returns:
   {
     "valid": true/false,
     "errors": [...],
     "warnings": [...],
     "info": [...]
   }
                ▼
5. Frontend:
   - Updates validation state in Zustand
   - Color-codes nodes (green/yellow/red)
   - Displays errors in ValidationPanel
```

---

## 🔌 API Contract Examples

### List Equipment Catalog
```http
GET /api/equipment-catalog

Response 200 OK:
{
  "equipment": [
    {
      "id": "hikvision_4k",
      "manufacturer": "Hikvision",
      "model": "DS-2CD2143G2-I",
      "type": "camera",
      "specs": {
        "resolution": "4K",
        "power_consumption": 3.5,
        "bandwidth": 8
      },
      "ports": [
        {"type": "power", "count": 1},
        {"type": "network", "count": 2}
      ]
    },
    ...
  ]
}
```

### Add Device to Project
```http
POST /api/projects/{project_id}/devices

Request:
{
  "equipment_id": "hikvision_4k",
  "name": "Front Door Camera",
  "position": {"x": 100, "y": 200}
}

Response 201 Created:
{
  "id": "device_abc123",
  "project_id": "project_456",
  "name": "Front Door Camera",
  "equipment_id": "hikvision_4k",
  "type": "camera",
  "model": "DS-2CD2143G2-I",
  "position": {"x": 100, "y": 200},
  "ports": [
    {"id": "p1", "type": "power"},
    {"id": "p2", "type": "network"}
  ],
  "status": "draft"
}
```

### Validate Project
```http
POST /api/projects/{project_id}/validate

Response 200 OK:
{
  "project_id": "project_456",
  "valid": true,
  "device_count": 5,
  "link_count": 4,
  "errors": [],
  "warnings": [
    {
      "type": "cable_length",
      "severity": "warning",
      "message": "Cable from camera_1 to switch_1 is 95m (near max)"
    }
  ],
  "info": [
    {
      "type": "total_power",
      "value": 125,
      "unit": "watts"
    }
  ]
}
```

---

## 🗄️ Database Schema (v0.2+)

```sql
-- Tables planned for v0.2 with PostgreSQL

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE devices (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  name VARCHAR(255) NOT NULL,
  equipment_id VARCHAR(100),
  type VARCHAR(50),
  model VARCHAR(100),
  position_x INT,
  position_y INT,
  status VARCHAR(20),
  created_at TIMESTAMP
);

CREATE TABLE ports (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices,
  port_type VARCHAR(50),
  position INT,
  connected BOOLEAN DEFAULT false
);

CREATE TABLE links (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  source_device_id UUID REFERENCES devices,
  source_port_id UUID REFERENCES ports,
  target_device_id UUID REFERENCES devices,
  target_port_id UUID REFERENCES ports,
  cable_type VARCHAR(50),
  length_meters FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE validation_results (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  valid BOOLEAN,
  error_count INT,
  warning_count INT,
  validated_at TIMESTAMP
);
```

---

## 🔐 Security Considerations

### Current (MVP)
- ✅ CORS enabled for local development
- ✅ Input validation with Pydantic
- ⚠️ No authentication (not required for MVP)
- ⚠️ No rate limiting (single user)

### Future (v0.2+)
- [ ] JWT authentication
- [ ] Role-based access control (RBAC)
- [ ] API key management
- [ ] Rate limiting
- [ ] HTTPS enforcement
- [ ] SQL injection prevention (SQLAlchemy ORM)
- [ ] CSRF protection

---

## 📈 Scalability Plan

### v0.1 (Current MVP)
- Single process
- In-memory storage
- ~100 projects max (memory limited)
- Suitable for: Single user, local experimentation

### v0.2 (Database Integration)
- PostgreSQL database
- Multiple processes
- ~1M projects
- Suitable for: Small team, persistent storage

### v0.3 (API Optimization)
- Response caching
- GraphQL option
- WebSocket real-time (multiplayer)
- Suitable for: Larger deployments

### v1.0 (Enterprise Ready)
- Horizontal scaling
- Load balancing
- CDN for frontend assets
- Message queue for long-running tasks
- Suitable for: Enterprise deployments

---

## 📊 Component Communication

```
┌─────────────────────────────────┐
│   Equipment Library             │
└─────────────────┬───────────────┘
                  │ Drag & Drop
                  ▼
┌─────────────────────────────────┐
│   Canvas (React Flow)           │
│  - Nodes (DeviceNode)           │
│  - Edges (Connections)          │
│  - Handles (Ports)              │
└─────────────────┬───────────────┘
     │            │            │
     │ Selection  │ Update     │ Data
     ▼            ▼            ▼
┌──────────────────────────────────────────┐
│   Zustand Store (projectStore.ts)        │
│  - Project state                         │
│  - Nodes/Edges                           │
│  - Selection                             │
│  - Validation                            │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴──────────┬────────────────┐
     │                    │                │
     ▼                    ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ Properties   │  │ Validation   │  │ Toolbar     │
│ Panel        │  │ Panel        │  │             │
└──────────────┘  └──────────────┘  └─────────────┘
     │                    │                │
     └─────────────────────┴────────────────┘
              │
              ▼
     API Client (axios)
              │
              ▼
    FastAPI Backend (8000)
```

---

## 🚀 Deployment Architecture

### Development
```
User Machine
├── Terminal 1: backend (python -m uvicorn ...)
├── Terminal 2: frontend (npm run dev)
└── Browser: http://localhost:3000
```

### Production
```
Docker Container (future v0.3)
├── Backend: Gunicorn + Uvicorn
│   └── 4 workers, port 8000
├── Frontend: Nginx
│   └── Static files, port 80
└── PostgreSQL Database
    └── Persistent volume
```

---

## 🎯 Key Metrics

| Aspect | Current | Target |
|--------|---------|--------|
| API Response Time | <100ms | <50ms |
| Frontend Load Time | ~2s | <1s |
| Projects per user | 100s | 1000s |
| Devices per project | 50s | 1000s |
| Concurrent users | 1 | 100+ |

---

## 🔗 Integration Points

### Frontend → Backend
- **Protocol:** HTTP/REST
- **Format:** JSON
- **Auth:** None (MVP)
- **Base URL:** http://localhost:8000/api
- **Proxy:** Via Vite dev server

### Database → Backend (Future)
- **Database:** PostgreSQL 14+
- **ORM:** SQLAlchemy 2.0+
- **Connection:** postgresql://user:password@host/db
- **Migrations:** Alembic

### External Services (Future)
- **AI Provider:** OpenAI API (for AI assistant)
- **Cloud Storage:** S3 (for exports)
- **Analytics:** Mixpanel (for usage tracking)

---

## 📚 Technology Reasoning

### Why React + TypeScript?
- Type safety catches errors early
- Large component ecosystem
- Great DevTools for debugging
- Perfect for complex UIs like node editors

### Why Zustand?
- Lightweight state management
- No boilerplate like Redux
- Perfect for medium-sized apps
- Easy to learn and use

### Why React Flow?
- Excellent node-based editor library
- Active maintenance
- Rich feature set (minimap, controls, etc.)
- Great performance for large graphs

### Why FastAPI?
- Modern Python framework
- Automatic API documentation (Swagger)
- Great performance
- Built-in validation with Pydantic

### Why Vite?
- Incredibly fast build tool
- Near-instant HMR
- Smaller bundle sizes
- Perfect for modern frontend development

---

**Version:** 1.0.0  
**Status:** MVP Architecture Complete  
**Last Updated:** 7 March 2026
