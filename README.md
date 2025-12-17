# Insight Manager v7

A web application for managing insight content, display logic, and related images for mobile apps.

## Features

- JWT-based authentication with role-based access control (Admin/Manager/Viewer)
- Complete CRUD operations for insights (34 fields)
- Image upload and management (teaser and story images)
- CSV import/export functionality
- Master data management
- Search and filtering capabilities

## Tech Stack

- **Runtime**: Bun v1.x
- **Backend**: ElysiaJS
- **Frontend**: React + Vite
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Container**: Docker + Docker Compose

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

## Default Users

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Admin | Full access including master data management |
| manager | manager123 | Manager | Create, edit, delete insights and CSV operations |
| viewer | viewer123 | Viewer | Read-only access |

## Project Structure

```
insight-manager-v7/
├── src/
│   ├── db/           # Database schema and connection
│   ├── routes/       # API routes
│   └── server.ts     # ElysiaJS server
├── public/           # React frontend
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## License

MIT