# Stelthion Dashboard

A Next.js dashboard application with role-based access control, multi-language support, and customer separation.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- PostgreSQL (Database)

## Project Structure
```
src/
  app/
    (auth)/                 # Auth pages (login, register, etc.)
    api/                    # API routes
    dashboard/              # Protected dashboard pages
  components/
    dashboard/              # Dashboard-specific components
    ui/                     # Reusable UI components
  context/                  # React context providers
  lib/                      # Utility functions
  types/                    # TypeScript types
```

## Features

### Completed

- Dashboard layout with sidebar and header
- Icon-based navigation
- Real-time date and time display
- Multi-language support (ENG, FIN)
- Role-based sidebar filtering
- Responsive design

### In Progress

- Database setup (Prisma)
- User authentication
- Role-based access control (ADMIN, MANAGER, USER)
- Customer separation by customer ID
- Two-factor authentication
- User management (CRUD)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or MySQL/SQLite)

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/stelthion.git
cd stelthion
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/stelthion"
```

4. Set up database
```bash
npx prisma db push
npx prisma generate
```

5. Run development server
```bash
npm run dev
```

Open http://localhost:3000

## User Roles

| Role | Permissions |
|------|-------------|
| ADMIN | Full access, manage users |
| MANAGER | View all data, limited management |
| USER | Basic access |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/me | Get current user |
| GET | /api/users | List users (admin only) |
| POST | /api/users | Create user (admin only) |
| GET | /api/users/[id] | Get user by ID |
| PUT | /api/users/[id] | Update user |
| DELETE | /api/users/[id] | Delete user |

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Database connection string |
| NEXTAUTH_SECRET | Secret for session encryption |
| NEXTAUTH_URL | Application URL |

## License

Private - All rights reserved