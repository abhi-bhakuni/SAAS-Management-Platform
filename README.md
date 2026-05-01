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

---

## Glimpse⭐

<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 30 29" src="https://github.com/user-attachments/assets/7e7c0f9d-bdac-44e6-a6d1-11215dbd7f71" /><br></br>
<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 30 46" src="https://github.com/user-attachments/assets/9c7d488e-b4cd-4911-b765-8e4aa59e42a8" /><br></br>
<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 31 15" src="https://github.com/user-attachments/assets/2a9028bc-99d9-4cf0-abc5-66a9f5598489" /><br></br>
<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 31 31" src="https://github.com/user-attachments/assets/ac547ca2-5087-47dc-b0b7-e52533a5fd2e" /><br></br>
<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 31 46" src="https://github.com/user-attachments/assets/9c9cf900-e82b-433b-b628-4f707a7ea813" /><br></br>
<img width="2940" height="1590" alt="WhatsApp Image 2026-04-30 at 20 32 31" src="https://github.com/user-attachments/assets/abc57ff3-e5b1-4f82-83a7-e625448d4ad4" /><br></br>
<img width="2940" height="1664" alt="WhatsApp Image 2026-04-30 at 20 40 09" src="https://github.com/user-attachments/assets/a35af129-eb32-431b-aec4-e0b8394f960b" /><br></br>
<img width="2940" height="1594" alt="WhatsApp Image 2026-04-30 at 20 40 53" src="https://github.com/user-attachments/assets/2f3e4451-788a-4046-8c5e-ff13f92d3284" /><br></br>
