# SAAS Management Platform

A full-stack multi-tenant SaaS platform with organization workspaces, project/task management, Stripe billing, real-time chat, and 2FA.

**Backend**: NestJS 10 · TypeScript · PostgreSQL · TypeORM  
**Frontend**: React 19 · Vite 8 · Material UI v7 · Socket.io

---

## Architecture

```
SAASManagementPlatform/
├── backend/     # NestJS REST API + WebSocket
└── frontend/    # React SPA
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)

### Backend
```bash
cd backend
cp .env.example .env        # fill in values
docker-compose up -d        # start PostgreSQL
npm install
npm run migration:run
npm run seed:run
npm run dev
# API:     http://localhost:3000
# Swagger: http://localhost:3000/api
# Health:  http://localhost:3000/health
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## Features

| Area | Features |
|------|---------|
| Auth | JWT, 2FA (TOTP), password reset, brute-force protection |
| Multi-org | Workspace switching, invite system, role-based access (ADMIN / MANAGER / MEMBER) |
| Projects | Project CRUD, Kanban board (drag-and-drop), task management |
| Billing | Stripe Checkout, Billing Portal, webhooks, subscription plans |
| Real-time | Socket.io chat widget, WebSocket gateway |
| Analytics | Dashboard KPIs, org activity feed, audit logs |
| DevOps | Docker, Nginx, production deploy script |

---

## Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| API | NestJS | 10.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 16 |
| ORM | TypeORM | 0.3.17 |
| Auth | JWT + Passport | — |
| Payments | Stripe SDK | 22.x |
| Real-time | Socket.io | 4.8 |
| Frontend | React + Vite | 19.x / 8.x |
| UI | Material UI | 7.x |
| Drag-drop | @dnd-kit | 6.x |

---

## Documentation

- [backend/README.md](backend/README.md) — API setup, endpoints, security, production deployment
- [frontend/README.md](frontend/README.md) — Frontend setup, pages, API integration
