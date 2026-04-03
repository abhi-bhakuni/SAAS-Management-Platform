# SAAS Management Platform - Backend

A NestJS-based backend for the SAAS Management Platform with modular architecture.

## Project Structure

```
src/
  ├── modules/
  │   ├── auth/                 # Authentication module
  │   │   ├── controllers/
  │   │   ├── services/
  │   │   ├── dtos/
  │   │   └── strategies/
  │   ├── users/                # Users management module
  │   │   ├── controllers/
  │   │   ├── services/
  │   │   ├── entities/
  │   │   └── dtos/
  │   ├── subscriptions/        # Subscriptions management module
  │   │   ├── controllers/
  │   │   ├── services/
  │   │   ├── entities/
  │   │   └── dtos/
  │   ├── organisms/            # Organizations module (planned)
  │   └── database/             # Database configuration
  ├── common/                   # Shared utilities
  │   ├── dtos/
  │   ├── entities/
  │   ├── exceptions/
  │   ├── interfaces/
  │   └── decorators/
  ├── guards/                   # Authentication guards
  ├── interceptors/             # Request/Response interceptors
  ├── filters/                  # Exception filters
  ├── decorators/               # Custom decorators
  ├── constants/                # Application constants
  ├── config/                   # Configuration files
  ├── app.module.ts            # Root module
  ├── app.controller.ts        # Root controller
  ├── app.service.ts           # Root service
  └── main.ts                  # Application entry point
```

## Features

- **Modular Architecture**: Organized by feature modules (Auth, Users, Subscriptions)
- **NestJS Framework**: Full-featured Node.js framework
- **TypeScript**: Type-safe development
- **Configuration Management**: Environment-based configuration with @nestjs/config
- **Global Validation**: Request DTO validation
- **CORS Enabled**: Cross-origin resource sharing support

## Installation

```bash
npm install
```

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run prod

# Debug mode
npm run debug
```

## Environment Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## Available Endpoints

- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/register`, `POST /auth/login`
- **Users**: `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`
- **Subscriptions**: `GET /subscriptions`, `POST /subscriptions`, `PUT /subscriptions/:id`

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:cov` - Run tests with coverage

## Modules Overview

### Auth Module
Handles user authentication including registration and login.

**TODO**: 
- Implement JWT strategy
- Add password hashing
- Implement token validation

### Users Module
Manages user CRUD operations.

**TODO**:
- Connect to database (TypeORM)
- Implement pagination
- Add user roles and permissions

### Subscriptions Module
Manages subscription plans and billing.

**TODO**:
- Integrate with Stripe
- Implement subscription lifecycle events
- Add billing webhooks

## Next Steps

1. **Database Setup**: Configure PostgreSQL and TypeORM
2. **Authentication**: Implement JWT with Passport
3. **Validation**: Create DTOs with validation rules
4. **Error Handling**: Implement global exception filters
5. **Testing**: Add unit and integration tests
6. **API Documentation**: Integrate Swagger/OpenAPI

## Database Schema (Planned)

The following tables are planned:
- `users` - User accounts
- `subscriptions` - User subscriptions
- `organizations` - Organization management
- `audit_logs` - Activity tracking

## Contributing

Follow the modular structure and keep related functionality together.

## License

UNLICENSED
