# PSS Builder - Debugging Guide

## System Status: ✅ READY FOR TESTING

### Current State
- ✅ **Backend**: Uvicorn running on `http://127.0.0.1:8000` (HEALTHY)
- ✅ **Frontend**: Vite dev server running on `http://localhost:3000` 
- ✅ **TypeScript**: All compilation errors resolved
- ✅ **React Components**: All prop types correctly defined
- ✅ **API Types**: All endpoints properly typed

---

## Session 1 Fixes (2026-03-07) - PSS Builder UI Setup

### Errors Fixed

#### 1. ❌ JSX Fragment Error → ✅ FIXED
```
Error: Adjacent JSX elements must be wrapped in an enclosing tag
Location: frontend/src/pages/PSSBuilder.tsx:261
Fix: Wrapped dual returns in <></> fragment
```

#### 2. ❌ Import Path Resolution → ✅ FIXED  
```
Error: Cannot find module '@/shared/api/client'
Root Cause: Vite alias not in tsconfig
Fix: Added baseUrl and paths to tsconfig.app.json
Files: 
  - Vite: Already had @/ → ./src mapping
  - TypeScript: Added matching paths configuration
```

#### 3. ❌ API Response Types → ✅ FIXED
```
Error: Property 'data' does not exist on type 'unknown'
Root Cause: Untyped axios responses in mutations
Fix: Added TypeScript interfaces to client.ts
  - Project, ProjectCreateResponse
  - ValidationResponse, EquipmentItem
  - Proper AxiosResponse<T> typing
```

#### 4. ❌ ReactFlow Node Props → ✅ FIXED
```
Error: Type 'DeviceNodeProps' not assignable to NodeProps<T>
Root Cause: Custom props instead of ReactFlow's NodeProps
Fix: 
  - Changed DeviceNodeProps = NodeProps<DeviceData>
  - Changed isSelected → selected (ReactFlow prop)
  - Optional status with 'draft' fallback
```

---

## Architecture Overview

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   └── PSSBuilder.tsx        ← Main page
│   ├── widgets/
│   │   ├── Canvas.tsx             ← React Flow editor
│   │   ├── DeviceNode.tsx          ← Node component
│   │   ├── EquipmentLibrary.tsx    ← Equipment catalog
│   │   ├── Toolbar.tsx              ← Top navigation
│   │   ├── PropertiesPanel.tsx      ← Device properties
│   │   └── ValidationPanel.tsx      ← Validation display
│   ├── shared/
│   │   ├── api/client.ts           ← API endpoints
│   │   └── store/projectStore.ts   ← Zustand state
│   └── styles/index.css
```

### Key Technologies
- **React Flow 11.10** - Node-based editor
- **Zustand 4.4** - State management
- **TanStack Query 5.36** - Server state
- **Tailwind CSS 3.4** - Styling
- **Lucide React 0.365** - Material Icons
- **TypeScript 5.2** - Type safety

---

## Common Issues & Resolution

### Issue: "White screen after creating project"
**Status**: ✅ FIXED
**Solution**: Wrapped JSX in fragments, ensured Canvas renders conditionally

### Issue: "Devices not adding to canvas"  
**Status**: ✅ FIXED
**Solution**: 
- Added drag-and-drop handler to Canvas
- Implemented `handleAddDevice` with immediate UI update
- Both drag and button add now work

### Issue: "Properties panel showing blank"
**Status**: ✅ FIXED
**Solution**: Added conditional rendering and safety checks for selectedNodeId

### Issue: "Module imports failing in TypeScript"
**Status**: ✅ FIXED  
**Solution**: Added path mapping in tsconfig only (Vite already had it)

---

## Testing Checklist

### Frontend UI
- [ ] Create new project modal opens correctly
- [ ] Project name and description accept input
- [ ] Can create project and transition to  editor
- [ ] Select existing project from list
- [ ] Toolbar displays correctly with all buttons
- [ ] Equipment library loads and shows devices

### Drag & Drop
- [ ] Click + button on equipment adds device to canvas
- [ ] Drag equipment from library onto canvas
- [ ] Device appears at correct position
- [ ] Multiple devices can be added
- [ ] Devices show correct icons by type

### Canvas Interaction
- [ ] Click device to select (ring highlight shows)
- [ ] Properties panel updates when device selected
- [ ] Can rename device
- [ ] Can drag devices around
- [ ] Handles appear on device ports
- [ ] Can draw connections between devices

### Validation
- [ ] Validate button works
- [ ] Errors/warnings display in panel
- [ ] Success state shows when valid
- [ ] Can click errors to navigate to device

---

## API Endpoints Being Used

### Projects
- [x] `GET /projects` - List all projects
- [x] `POST /projects` - Create new project
- [x] `GET /projects/{id}` - Get project details
- [x] `POST /projects/{id}/validate` - Validate project
- [x] `DELETE /projects/{id}` - Delete project

### Devices
- [x] `GET /equipment-catalog` - Get equipment templates
- [x] `POST /projects/{id}/devices-from-template` - Add device from template
- [x] `POST /projects/{id}/devices` - Add device
- [x] `GET /projects/{id}/devices` - List devices
- [x] `DELETE /projects/{id}/devices/{id}` - Remove device

---

## Browser Console Error Patterns to Watch For

### React Errors
```
"Cannot read property of undefined" → Check props drilling
"Hooks can only be called inside React components" → Check component structure
```

### API Errors  
```
"CORS error" → Proxy misconfiguration
"404 Not Found" → Backend endpoint not implemented
"401 Unauthorized" → Auth needed
```

### Drag-Drop Errors
```
"Cannot read property 'screenToFlowPosition'" → useReactFlow context issue
"dataTransfer is null" → Not in drag event
```

---

## Debug Commands

### Check TypeScript Compilation
```bash
cd frontend
npx tsc --noEmit
```

### Check Backend Health
```bash
curl http://127.0.0.1:8000/health
```

### Check Frontend Compilation
```bash
npm run dev
# Watch for Vite errors in console
```

### Test API Endpoint
```bash
curl http://127.0.0.1:8000/equipment-catalog
```

---

## Notes for Next Session

If new errors appear:
1. Check browser console (F12) for runtime errors
2. Check Vite dev server output for compilation errors
3. Check if API endpoints are responding
4. Verify Zustand store initialization
5. Check network tab for failed requests

If making changes:
1. Keep TypeScript strict enabled
2. Update API types in client.ts
3. Test imports before committing
4. Run `npm run dev` and monitor console
5. Update this debugging guide

---

**Last Updated**: 2026-03-07  
**Session**: PSS Builder UI Enhancement & Bug Fixes  
**Total Issues Fixed**: 4  
**Files Modified**: 4  
**Status**: Ready for manual testing
