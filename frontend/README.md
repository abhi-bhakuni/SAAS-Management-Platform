# Kanban Board Implementation

A modern, drag-and-drop Kanban board built with React, TypeScript, and Tailwind CSS.

## Features

- **Drag & Drop**: Full drag-and-drop functionality using @dnd-kit
- **Column-based UI**: Four columns representing task statuses (To Do, In Progress, In Review, Done)
- **Real-time Updates**: Live synchronization using Socket.io
- **Activity Feed**: Real-time notifications for task changes
- **API Integration**: Ready for backend integration with the existing NestJS API
- **Responsive Design**: Clean, modern UI with Tailwind CSS
- **TypeScript**: Fully typed for better development experience

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- **Real-time**: Socket.io client
- **HTTP Client**: Axios
- **Backend**: NestJS + TypeORM + PostgreSQL (existing)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── KanbanBoard.tsx    # Main board component
│   │   ├── KanbanColumn.tsx   # Individual column component
│   │   └── TaskCard.tsx       # Task card component
│   ├── services/
│   │   └── api.ts             # API service layer
│   ├── types/
│   │   └── task.ts            # TypeScript type definitions
│   ├── App.tsx                # Main app component
│   └── index.css              # Global styles with Tailwind
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## Getting Started

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:5173`

## API Integration

The frontend is designed to work with the existing backend API endpoints:

- `GET /organizations/:orgId/projects/:projectId/tasks` - Fetch tasks
- `PATCH /organizations/:orgId/projects/:projectId/tasks/:taskId/status` - Update task status

### Current State

- ✅ Frontend UI with drag & drop
- ✅ Real-time WebSocket integration
- ✅ Activity feed with live notifications
- 🔄 API service layer (ready for integration)
- 🔄 Authentication (needs implementation)

## Task Status Flow

Tasks can be moved between these statuses:
1. **To Do** → Initial state for new tasks
2. **In Progress** → Work is actively being done
3. **In Review** → Task is ready for review/QA
4. **Done** → Task is completed

## Drag & Drop Features

- Drag tasks between columns to change status
- Drag tasks within the same column to reorder
- Visual feedback during dragging
- Smooth animations and transitions

## Real-time Features

### WebSocket Integration
- **Live Task Updates**: Changes are instantly reflected across all connected clients
- **Activity Events**: Notifications for task movements, assignments, and updates
- **Connection Status**: Visual indicators for WebSocket connection state
- **Auto-reconnection**: Automatic reconnection with exponential backoff

### Activity Types
- **Task Moved**: When a task status changes between columns
- **Task Assigned**: When a task is assigned to a user
- **Task Created**: When a new task is added
- **Task Updated**: When task details are modified
- **Task Deleted**: When a task is removed

## Backend Setup

The backend requires Socket.io integration:

1. **Install WebSocket dependencies**:
   ```bash
   cd backend
   npm install @nestjs/websockets@^10.0.0 @nestjs/platform-socket.io@^10.0.0 socket.io
   ```

2. **Start backend server**:
   ```bash
   npm run dev
   ```

## Real-time Synchronization

### Client-side Updates
- **Optimistic Updates**: UI updates immediately on drag actions
- **Server Confirmation**: Changes are validated and confirmed via WebSocket
- **Conflict Resolution**: Automatic reversion on update failures

### Server-side Broadcasting
- **Room-based**: Updates are scoped to specific organization/project rooms
- **Event Types**: Different event types for different actions
- **User Context**: Events include user information for activity feeds
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
