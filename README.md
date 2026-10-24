# Car Dealership Inventory System

## Overview

A full-stack car dealership inventory management system built with FastAPI and React. Developed using Test-Driven Development (TDD), the project aims to provide a reliable foundation for managing dealership inventory, with authentication and inventory features implemented incrementally.

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env            # then set a random SECRET_KEY and a real ADMIN_PASSWORD
alembic upgrade head            # creates the SQLite database and its tables
python -m app.seed_admin        # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
uvicorn app.main:app --reload   # API docs at http://localhost:8000/docs
```

The seed script is safe to run more than once. It never changes an existing admin's password, and it refuses to run if `ADMIN_EMAIL` already belongs to a normal user.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                     # http://localhost:5173
```

## Design Decisions

| Decision | Reason |
|---|---|
| FastAPI backend | Builds REST APIs with built-in validation and automatic Swagger docs |
| React + Vite frontend | A separate, maintainable UI |
| Environment variables | Settings and secrets stay out of the code |
| Test-Driven Development | Every rule starts as a failing test; the commit history shows Red → Green → Refactor |
| Git and GitHub | Tracks changes and keeps a readable commit history |
| Routes → Services → Repositories | Routes handle HTTP, services hold the rules, repositories talk to the database; each is small and testable |
| Alembic migrations | Every schema change is versioned in git and reviewable, and can be rolled back; `create_all` can't alter existing tables |
| Emails stored lowercase | `Siri@Example.com` and `siri@example.com` are one account, and the unique index enforces it |
| Password limit of 72 bytes | bcrypt's limit; counted in bytes, not characters, because `é` is 2 bytes |
| Same 401 for a wrong password and an unknown email | The API doesn't reveal which emails have accounts |
| `is_admin` in the register body is ignored | Registration can never create an admin; a regression test guards this |
| Seed script refuses to promote an existing user | Otherwise whoever registered the admin email first would become admin |
| `GET /api/auth/me` instead of user data in the JWT | The server stays the source of truth for `is_admin`, and the token stays small |

## API

All endpoints are prefixed with `/api`. Protected endpoints need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| `GET` | `/health` | none | `200` `{"status": "ok"}` | — |
| `POST` | `/api/auth/register` | none | `201` `{id, email, is_admin}` | `409` email taken, `422` invalid input |
| `POST` | `/api/auth/login` | none | `200` `{access_token, token_type}` | `401` wrong email or password |
| `GET` | `/api/auth/me` | Bearer | `200` `{id, email, is_admin}` | `401` missing, invalid or expired token |

Interactive docs: http://localhost:8000/docs. Log in, then use **Authorize** and paste the token.

## Tests

```bash
cd backend && pytest
cd backend && pytest --cov=app --cov-report=term-missing   # with coverage
cd frontend && npm run test:run
```

## Screenshots

_TODO_

## My AI Usage

I used AI as a development assistant to clarify concepts and guide the implementation process. I checked the results of commands and tests as I worked. I intend to continue using a test-first approach, reviewing AI suggestions critically and ensuring that I understand the code I commit.

### Phase 1 – Authentication

_TODO: write in my own words._
