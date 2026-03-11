# PSS Builder Frontend

Modern React + TypeScript frontend for the Security Systems Architecture Constructor.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## ✨ Features

### Core Functionality ✅
- **Project Management** - Create and manage security system projects
- **Node-Based Editor** - Visual architecture design with React Flow
- **Equipment Library** - 11+ pre-configured device models
- **Drag & Drop** - Add devices to canvas easily
- **Port Connections** - Connect devices port-to-port
- **Real-time Validation** - Automatic error checking and warnings
- **Properties Panel** - Edit device and connection properties
- **Responsive Layout** - Optimized for desktop engineering work

### UI Components
- Canvas with pan/zoom and minimap
- Equipment library with search & filter
- Properties panel for selected elements
- Validation panel with error grouping
- Toolbar with save & validate actions
- Status indicators and feedback

## 🏗️ Architecture

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Flow** - Node-based editor
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Project Structure

```
frontend/src/
├── app/              # Application configuration
├── pages/           # Page containers
│   └── PSSBuilder.tsx    # Main page
├── widgets/         # Reusable UI components
│   ├── Canvas.tsx
│   ├── DeviceNode.tsx
│   ├── EquipmentLibrary.tsx
│   ├── PropertiesPanel.tsx
│   ├── ValidationPanel.tsx
│   └── Toolbar.tsx
├── entities/        # Domain models
├── features/        # Feature modules
├── shared/          # Shared utilities
│   ├── api/client.ts    # Backend API client
│   └── store/projectStore.ts # State management
├── processes/       # Business logic
└── styles/         # Global styling
```

## 📖 Usage

### Creating a Project
1. Click "New Project" button
2. Enter project name and description
3. Confirm to create

### Adding Devices
1. Browse or search equipment library on left
2. Drag device to canvas or click + button
3. Device appears as a node on canvas

### Connecting Ports
1. Hover over device ports
2. Click connection point and drag to target port
3. Set cable type and length in properties

### Validating
1. Click "Validate" button in toolbar
2. Review errors and warnings in right panel
3. Fix issues by adjusting architecture

### Saving
1. Make changes to project
2. Click "Save" button
3. Changes are persisted to backend

## 🔌 API Integration

Backend endpoints used:

**Projects**
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/validate` - Validate project

**Devices**
- `GET /api/projects/{id}/devices` - List devices
- `POST /api/projects/{id}/devices` - Add device
- `GET /api/equipment-catalog` - Get equipment catalog

**Templates & Rules**
- `GET /api/templates` - List solution templates
- `GET /api/rules` - Get validation rules

## 🎨 Styling

Using Tailwind CSS with custom brand colors:

```css
/* Brand colors */
--brand-50: #f8f7ff
--brand-500: #667eea
--brand-900: #2d3466
```

## 📦 Building

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### Port 3000 already in use?
Edit `vite.config.ts` and change port number

### API connection errors?
1. Ensure backend is running on port 8000
2. Check proxy in `vite.config.ts`
3. Verify API client URL

### Missing modules?
```bash
npm install
npm run dev
```

## 📚 Documentation

- [Development Guide](./DEVELOPMENT.md) - Detailed development setup
- [Frontend Manifest](../frontend_manifest.txt) - Requirements & specifications
- [Backend README](../README.md) - Backend documentation

## 🚀 Performance

- Virtual scrolling in lists
- Memoized components
- Lazy loaded assets
- Optimized re-renders
- Efficient state management

## 🛣️ Roadmap

### v0.1.0 (Current)
- ✅ Project management
- ✅ Node-based editor
- ✅ Equipment library
- ✅ Basic validation
- ✅ Properties editing

### v0.2.0 (Planned)
- [ ] AI assistant UI
- [ ] Undo/Redo
- [ ] Zone grouping
- [ ] Export/Import
- [ ] History tracking

### v0.3.0 (Future)
- [ ] 3D visualization
- [ ] BOM generator
- [ ] Collaborative editing
- [ ] Custom templates
- [ ] Advanced layouts

## 📄 License

MIT

## 👨‍💻 Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for contribution guidelines.

---

**Version:** 0.1.0 Beta  
**Status:** MVP Ready  
**Last Updated:** 7 March 2026
