# Frontend — SAAS Management Platform

React 19 SPA with MUI dark theme, Kanban board, Stripe billing, and real-time Socket.io chat.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Backend running at `http://localhost:3000`

```bash
npm install
npm run dev
# → http://localhost:5173
```

```bash
npm run dev       # Vite dev server with HMR
npm run build     # TypeScript compile + production bundle
npm run preview   # Preview production build
npm run lint
```

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Auth | Login, Register, Forgot/Reset Password, Accept Invite |
| `/dashboard` | Dashboard | KPI cards (users, projects, tasks, revenue) |
| `/projects` | Projects | Project list, create, delete |
| `/projects/:id` | Project Details | Kanban board + table view, task CRUD |
| `/tasks` | Global Tasks | Cross-project task list with filters |
| `/activity` | Activity | Org-wide audit/activity feed |
| `/settings` | Settings | Profile, billing, security (2FA), team |
| `/support` | Support | Help page |

---

## Project Structure

```
src/
├── App.tsx                    # MUI ThemeProvider + React Router routes
├── context/
│   ├── AuthContext.tsx        # Global auth state (user, token, login/logout)
│   └── ToastContext.tsx       # Global toast notifications
├── services/
│   ├── api.ts                 # Axios client — all API service groups
│   └── socket.ts              # Socket.io client
├── components/
│   ├── Sidebar.tsx            # Collapsible nav + org/workspace switcher
│   ├── ChatWidget.tsx         # Floating real-time support chat
│   ├── KanbanBoard.tsx        # Drag-and-drop Kanban (dnd-kit)
│   ├── KanbanColumn.tsx
│   ├── TaskCard.tsx
│   ├── TaskRow.tsx
│   ├── ActivityFeed.tsx
│   ├── AssigneeSelect.tsx
│   ├── TaskStatusSelect.tsx
│   ├── DarkDatePicker.tsx
│   ├── PremiumTooltip.tsx
│   └── ProtectedRoute.tsx
├── pages/
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── ProjectDetails.tsx
│   ├── GlobalTasks.tsx
│   ├── ActivityPage.tsx
│   ├── Settings.tsx
│   └── Support.tsx
└── types/
    └── task.ts
```

---

## API Integration

All requests go through `src/services/api.ts`. Axios auto-attaches:

```
Authorization: Bearer <jwt>
x-org-id: <selectedOrgId>
x-org-user-id: <userId>
```

Global 401 handler clears localStorage and redirects to `/login`.

### Service Groups

| Export | Covers |
|--------|--------|
| `authApi` | login, register, acceptInvite, getCurrentUser, updateProfile |
| `dashboardApi` | getStats |
| `organizationApi` | members, invites, roles |
| `billingApi` | subscription, checkout, portal, cancel |
| `projectsApi` | CRUD |
| `taskApi` | CRUD, status, assignees |
| `activityApi` | feed |
| `securityApi` | password, 2FA, login activity, account delete |
| `passwordApi` | forgot/reset |
| `chatApi` | conversations, messages |

---

## Auth Flow

1. POST `/auth/login` → JWT + user stored in `localStorage`
2. `AuthContext` exposes `user`, `token`, `login()`, `logout()`
3. Protected pages wrap with `<ProtectedRoute>`
4. 401 → Axios interceptor clears storage + redirect to `/login`

**Workspace switching** (Sidebar): POST `/auth/switch-workspace` → new JWT issued

---

## Tech Stack

| Tech | Version | Purpose |
|------|---------|---------|
| React | 19.x | UI |
| TypeScript | 5.9 | Type safety |
| Vite | 8.x | Build + dev server |
| Material UI | 7.x | Components + dark theme |
| React Router | 7.x | Routing |
| Axios | 1.14 | HTTP client |
| Socket.io Client | 4.8 | Real-time |
| @dnd-kit | 6.x | Drag-and-drop Kanban |
| TailwindCSS | 4.x | Supplemental utility CSS |

---

## Theme

| Token | Value |
|-------|-------|
| Background | `#0F0F11` |
| Paper | `#18181B` |
| Primary | `#FFFFFF` |
| Text secondary | `#A1A1AA` |
| Font | Inter, Outfit, Segoe UI |
| Border radius | 10px (cards 12px) |

---

## Production Build

```bash
npm run build
# Output: frontend/dist/
```

Served by Nginx container defined in `backend/nginx.conf` and `backend/docker-compose.prod.yml`.
