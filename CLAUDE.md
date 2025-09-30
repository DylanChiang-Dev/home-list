# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home List is a family task management system built with React + TypeScript frontend and Cloudflare Workers + Hono backend. The system supports user authentication, family management, task assignment, and localStorage-to-D1 database migration.

## Common Commands

### Frontend Development
```bash
# Start development server (frontend only)
npm run dev

# Start with mock API server (frontend + mock backend)
npm run dev:full

# Build for production
npm run build

# Type checking
npm run check

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Backend (Workers) Development
```bash
cd workers

# Start local development
npm run dev

# Deploy to Cloudflare
npm run deploy

# Dry run deployment (build only)
npm run build

# Run tests
npm test

# Type checking
npm run type-check
```

### Database Operations
```bash
cd workers

# Create D1 database
npx wrangler d1 create home-list-db

# Run migrations
npx wrangler d1 execute home-list-db --file=./schema.sql

# Query database
npx wrangler d1 execute home-list-db --command="SELECT * FROM users"

# Create KV namespace
npx wrangler kv:namespace create "HOME_LIST_KV"
```

### Debugging
```bash
# View real-time Workers logs
npx wrangler tail

# Local debugging with local mode
npx wrangler dev --local

# Check Wrangler configuration
npx wrangler whoami
```

## Architecture

### Frontend Architecture

**State Management:**
- `AuthContext` ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)): Handles user authentication, login, register, logout, and user data persistence
- `zustand` for local state management (tasks, UI state)

**API Layer:**
- `apiConfig.ts` ([src/utils/apiConfig.ts](src/utils/apiConfig.ts)): Multi-endpoint configuration with automatic failover between Local/Cloudflare Workers/Mock Server
- `api.ts` ([src/utils/api.ts](src/utils/api.ts)): API request wrapper with retry logic, timeout handling, exponential backoff, and automatic endpoint switching on network errors

**Routing:**
- React Router v7 ([src/router/index.tsx](src/router/index.tsx))
- Protected routes require authentication via AuthContext

**Key Pages:**
- `Home`: Task dashboard with filtering (status, priority, type, assignee)
- `Login/Register`: Authentication with create/join family options
- `FamilyManagement`: Invite code generation, member management, role transfer
- `CreateTask`: Task creation with regular/long-term/recurring types
- `ApiTest`: Network diagnostics and API endpoint testing
- `ErrorDiagnosis`: API connection troubleshooting
- `DataMigration`: localStorage to D1 database migration interface

### Backend Architecture

**Framework:** Hono.js on Cloudflare Workers

**Database:** Cloudflare D1 (SQLite) with 4 main tables:
- `users`: User authentication and family membership
- `families`: Family groups with admin management
- `tasks`: Task assignment and tracking with recurring support
- `invite_codes`: Family invitation system

**Routes:**
- `/api/auth`: Authentication (login, register, profile, token refresh)
- `/api/tasks`: CRUD operations, completion tracking, statistics
- `/api/family`: Family creation, invites, member management
- `/api/migration`: localStorage data import and validation
- `/health`: Health check endpoint

**Middleware:**
- JWT authentication middleware ([workers/src/middleware/auth.ts](workers/src/middleware/auth.ts))
- CORS with configurable origins
- Request logging

**Security:**
- bcryptjs for password hashing
- JWT token-based authentication
- SQL injection protection via D1 prepared statements
- Role-based access control (admin/member)

### API Integration Flow

1. Frontend calls API via `apiRequest()` wrapper
2. `apiConfig` provides current endpoint (Local → Cloudflare → Mock)
3. On network error, automatically switches to next available endpoint
4. Retry logic with exponential backoff (max 3 retries)
5. JWT token from localStorage included in Authorization header
6. Backend validates token via auth middleware
7. Response with success/error structure returned to frontend

### Task System

**Task Types:**
- `regular`: Single completion tasks
- `long_term`: Extended duration tasks
- `recurring`: Automated recreation based on schedule rules

**Recurring Rules:**
- Daily/weekly/monthly/yearly patterns
- Specific days of week/month
- Custom intervals and end dates
- Stored as JSON in `recurring_rule` column

**Task Status Flow:** `pending` → `in_progress` → `completed`

## Configuration Files

- `wrangler.toml`: Cloudflare Workers config (D1 binding, KV binding, environment variables)
- `vite.config.ts`: Vite build config with React and tsconfig paths
- `tsconfig.json`: TypeScript compiler options
- `tailwind.config.js`: Tailwind CSS theme configuration

## Development Notes

**API Endpoint Switching:**
- Frontend automatically detects failed connections and switches endpoints
- Priority order: Local (3001) → Cloudflare Workers → Mock (3002)
- Use `ApiEndpointSwitcher` component to manually test endpoints

**Error Handling:**
- All API calls return `ApiResponse<T>` with `success`, `data`, `error`, `status`
- Network errors trigger automatic retry with endpoint switching
- Detailed error logging in console for debugging

**Authentication Flow:**
1. User logs in → backend returns JWT token
2. Token stored in localStorage as `authToken`
3. All API requests include `Authorization: Bearer <token>` header
4. Backend validates token on protected routes
5. Invalid token returns 401, triggering logout

**Family Management:**
- Each user belongs to one family (family_id in users table)
- Admin role required for: generating invites, removing members, transferring ownership
- Invite codes expire after 7 days
- Users can leave family (except admin)

**Data Migration:**
- `DataMigration` component exports localStorage data
- Backend `/api/migration/import` validates and imports
- Preserves task relationships and family structure