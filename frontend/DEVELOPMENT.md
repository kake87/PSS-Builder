# Frontend Setup & Development Guide

## Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env.local
   ```

## Development

### Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

API requests are proxied to `http://localhost:8000`

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## Architecture

### Directory Structure

```
frontend/src/
├── app/              # Application shell & config
├── pages/           # Page components
├── widgets/         # Reusable UI components
│   ├── Canvas.tsx          # React Flow node editor
│   ├── DeviceNode.tsx      # Device node visualization
│   ├── EquipmentLibrary.tsx # Equipment catalog
│   ├── PropertiesPanel.tsx  # Selected device properties
│   ├── ValidationPanel.tsx  # Validation & error display
│   └── Toolbar.tsx         # Top navigation toolbar
├── features/        # Feature modules
├── entities/        # Domain entities
├── shared/          # Shared utilities
│   ├── api/
│   │   └── client.ts       # API client for backend
│   └── store/
│       └── projectStore.ts # Zustand state management
├── processes/       # Business logic processes
└── styles/         # Global styles
    └── index.css    # Tailwind CSS imports
```

### State Management

Using **Zustand** for state management:

```typescript
// Store location: src/shared/store/projectStore.ts

import { useProjectStore } from '@/shared/store/projectStore'

const nodes = useProjectStore(s => s.nodes)
const setNodes = useProjectStore(s => s.setNodes)
```

### API Integration

Backend API client in `src/shared/api/client.ts`:

```typescript
import { projectsApi, devicesApi } from '@/shared/api/client'

// Examples:
projectsApi.listProjects()
devicesApi.getEquipmentCatalog()
```

## Key Components

### Canvas (React Flow)
- Node-based editor for architecture visualization
- Drag-and-drop support
- Pan & zoom controls
- Mini map

### Equipment Library
- Browse available devices from backend catalog
- Search & filter by model, vendor, type
- Drag-and-drop to canvas
- Quick add button

### Properties Panel
- Edit selected device properties
- View connected ports
- List all connections
- Real-time validation feedback

### Validation Panel
- Display project validation results
- Group errors by severity & type
- Quick navigation to problematic elements
- Recommendations and hints

### Toolbar
- Project creation & selection
- Save/Validate actions
- Settings access
- Unsaved changes indicator

## Styling

Using **Tailwind CSS** for styling:

```bash
# Configuration: tailwind.config.js
# Global styles: src/styles/index.css
```

Custom brand colors:
- `brand-50` to `brand-900` (based on purple gradient)

## Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

## Development Tips

### Hot Module Replacement (HMR)
Vite provides fast HMR - changes reflect instantly in browser

### TypeScript
Strict typing enabled. All components are fully typed.

### React Flow
Learn more: https://reactflow.dev/

### Zustand Store
Simple, intuitive state management pattern

## Building & Deployment

### Build:
```bash
npm run build
```

Output: `dist/` folder

### Deploy to production:
```bash
# Example: Deploy dist folder to your hosting service
```

## Troubleshooting

### Port 3000 already in use?
```bash
# Change port in vite.config.ts
```

### API connection errors?
- Ensure backend is running on `http://localhost:8000`
- Check proxy configuration in `vite.config.ts`
- Verify API client URL: `src/shared/api/client.ts`

### React Flow not rendering?
- Import styles: `import 'reactflow/dist/style.css'`
- Check Canvas component props
- Verify nodes & edges data format

## Next Steps

1. ✅ Install dependencies
2. ✅ Start development server
3. Create a new project from UI
4. Add devices from equipment library
5. Connect ports
6. Run validation
7. Check error messages

## Performance

- Virtual scrolling in equipment library
- Lazy loading of device details
- Memoized components to prevent unnecessary re-renders
- Asynchronous API calls with React Query

## Testing

(To be implemented)

```bash
npm run test
```

## Contributing

Follow the existing code style and directory structure.
Keep components focused and reusable.
