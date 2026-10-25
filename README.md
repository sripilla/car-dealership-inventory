# Car Dealership Inventory System

## Overview

A full-stack car dealership inventory management system built with FastAPI and React, developed using Test-Driven Development (TDD).

Users register and log in with JWT authentication. Logged-in users can browse every vehicle, search by make, model, category or price range, and add or update vehicles. Only admins can delete a vehicle. Each vehicle has an ID, make, model, category, price and quantity in stock. Any logged-in user can purchase a vehicle, which reduces its stock by one; a purchase at zero stock is rejected. Admins can also restock vehicles.

The frontend, **Forecourt**, is a React single-page app styled with Tailwind. Buyers browse the lot, search and filter it, and buy cars; the Purchase button is disabled when a car is out of stock. Admins get an extra **Admin** page to add, edit, delete and restock vehicles.

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

Start the backend first (above), then in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

The backend only accepts browser requests from the origins in `CORS_ORIGINS` (default `["http://localhost:5173"]`). If Vite starts on another port because 5173 is busy, stop the other server or add that origin to `CORS_ORIGINS` in `backend/.env`.

Log in as the admin created by the seed script to see the **Admin** page, or register a buyer account at `/register`.

## Design Decisions

### General

| Decision | Reason |
|---|---|
| FastAPI backend | Builds REST APIs with built-in validation and automatic Swagger docs |
| React + Vite frontend | A separate, maintainable UI |
| Environment variables | Settings and secrets stay out of the code |
| Test-Driven Development | Every rule starts as a failing test; the commit history shows Red → Green → Refactor |
| Git and GitHub | Tracks changes and keeps a readable commit history |
| Routes → Services → Repositories | Routes handle HTTP, services hold the rules, repositories talk to the database; each is small and testable |
| Domain errors in services, HTTP codes in routes | Services raise errors such as `VehicleNotFoundError` and never know about status codes, so they stay testable without HTTP |
| Alembic migrations | Every schema change is versioned in git and reviewable, and can be rolled back; `create_all` can't alter existing tables |

### Authentication

| Decision | Reason |
|---|---|
| Emails stored lowercase | `Siri@Example.com` and `siri@example.com` are one account, and the unique index enforces it |
| Password limit of 72 bytes | bcrypt's limit; counted in bytes, not characters, because `é` is 2 bytes |
| Same 401 for a wrong password and an unknown email | The API doesn't reveal which emails have accounts |
| `is_admin` in the register body is ignored | Registration can never create an admin; a regression test guards this |
| Seed script refuses to promote an existing user | Otherwise whoever registered the admin email first would become admin |
| `GET /api/auth/me` instead of user data in the JWT | The server stays the source of truth for `is_admin`, and the token stays small |

### Vehicles

| Decision | Reason |
|---|---|
| Price stored as integer rupees | SQLite has no exact decimal type, and car prices never use paise, so there is no rounding |
| Price must be > 0; quantity must be ≥ 0 | A free car is almost certainly a typo; quantity 0 is a normal "out of stock" state |
| Strict integers in request bodies | `"2"` or `true` is rejected instead of being silently converted |
| Make and model are trimmed; blank values are rejected | `"  Toyota "` is stored as `Toyota`; `""` and `"   "` return 422 |
| Fixed categories: Sedan, SUV, Hatchback, Electric | The UI uses a dropdown. Electric is a powertrain rather than a body type, but it is kept as its own category so EVs can be browsed together |
| Category matching is exact and case-sensitive | Values come from the dropdown; `sedan` or `Truck` returns 422 |
| Category is plain text in the database, validated by the API | Adding a category needs no migration; responses don't validate it, so old rows can never break a listing |
| Creating and updating need a login, not admin | Matches the API spec; the UI shows those forms to admins only |
| Deleting is admin-only | Matches the API spec. The admin check runs before the lookup, so a normal user gets 403 even for an unknown id and can't discover which ids exist |
| The list includes out-of-stock vehicles, ordered by id | The UI shows them with a disabled Purchase button; an explicit `ORDER BY` keeps the order stable on any database |
| Search on make and model is partial and case-insensitive | `toy`, `TOYOTA` and `yot` all match Toyota |
| `%` and `_` in a search are matched literally | Otherwise searching `%` would match every vehicle (they are SQL `LIKE` wildcards) |
| Search filters combine with AND | Each filter narrows the results; no filters returns every vehicle |
| Price range is inclusive; `min_price > max_price` returns 422 | An impossible range is a client mistake, and an empty result would hide it |
| Unknown search parameters return 422 | A typo such as `?modle=cam` is reported instead of silently returning every vehicle |
| `PUT` performs a partial update | The spec names `PUT`, but only the fields sent are changed (PATCH-like). Omitted fields keep their values and `{}` changes nothing |
| An explicit `null` in an update returns 422 | Omitting a field and sending `null` are different. Every column is required, so `null` is rejected instead of crashing on the database's NOT NULL constraint |

### Inventory

| Decision | Reason |
|---|---|
| A purchase always buys one unit, with no request body | Matches the spec's single Purchase button |
| The purchase is one conditional `UPDATE ... WHERE quantity >= 1` | The database checks and subtracts in one step, so two buyers can't both take the last car. No row changed means out of stock |
| Out-of-stock purchase returns 400 | The request can't be fulfilled until the vehicle is restocked; stock is never negative, even if the UI is bypassed |
| Restock is admin-only and checked before the lookup | Same rule as delete: a normal user gets 403 even for an unknown id |
| Restock quantity must be at least 1 (strict integer) | Restocking 0 or a negative amount is a client mistake, so it returns 422 |
| Purchase and restock return the updated vehicle | The UI can update the card without a second request |
| Errors are mapped in each route, not with global exception handlers | Same pattern as the earlier phases; centralising them is a possible refactor |

### Frontend

| Decision | Reason |
|---|---|
| Single-page app with React Router | One page load; real URLs keep the back button, refresh and bookmarks working; `ProtectedRoute` and `AdminRoute` guard `/` and `/admin` |
| Route guards wait for `GET /api/auth/me` | On reload the token is known before the user is; without the wait, a logged-in user would be bounced to `/login` |
| Token in `localStorage`, user from `/me` | Survives a reload; the server stays the source of truth for `is_admin`. Trade-off: scripts on the page can read `localStorage` (XSS); an httpOnly cookie would be safer but needs backend changes |
| One Axios instance with the `fetch` adapter | Every request gets the Bearer header in one place. Under jsdom, MSW can't intercept Axios's default XMLHttpRequest adapter; fetch works in every modern browser |
| Only a 401 logs the user out | A 403 (not an admin) or a 400 (sold out) means "not allowed" or "can't do that now", not "your login is invalid" |
| Browser-side checks mirror the API's rules | Password 8 characters / 72 bytes (counted like Python), price ≥ ₹1, quantity ≥ 0, restock ≥ 1, `min_price ≤ max_price`. The user gets instant feedback; the API is still the real guard |
| Empty search inputs are never sent; numbers are JSON numbers | The API answers `category=""` with 422 and treats an empty `make` as "match everything"; body integers are strict |
| Edit sends only the changed fields, and nothing if none changed | `PUT` is a partial update and rejects `null` with 422 |
| Stock shown is always the API's answer | After a purchase or restock the card shows the returned vehicle, not a local `count - 1`; a 400 on purchase (someone else bought the last one) reloads the list |
| Purchase button disabled while a purchase is in flight | A double click can't buy two cars |
| Delete asks for confirmation, with focus on "Keep it" | A stray Enter key can't delete a vehicle; Escape cancels |
| Prices use `Intl.NumberFormat('en-IN')` | Indian digit grouping: ₹20,95,000 |
| Category dropdown on every screen size | The mobile mockup shows chips; one control means one source of truth and one set of tests, and every category (including Electric) is reachable |
| CORS allows a fixed list of origins, not `*` | Only our own frontend may call the API from a browser; no cookies are used, so credentials stay off |
| Partial TDD on the frontend | Anything that makes a decision (disabled button, redirects, admin visibility, form rules, what is sent) was tested first; layout and colours were checked by eye |
| MSW mocks the network; tests query by role and label | Tests check what the user sees and what is actually sent, so the API client is tested too; no snapshots or class names |

## API

The health check is at `/health`; every other endpoint is under `/api`. Protected endpoints need the header `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| `GET` | `/health` | none | `200` `{"status": "ok"}` | — |
| `POST` | `/api/auth/register` | none | `201` `{id, email, is_admin}` | `409` email taken, `422` invalid input |
| `POST` | `/api/auth/login` | none | `200` `{access_token, token_type}` | `401` wrong email or password |
| `GET` | `/api/auth/me` | Bearer | `200` `{id, email, is_admin}` | `401` missing, invalid or expired token |

### Vehicles

A vehicle is returned as `{id, make, model, category, price, quantity}`.

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| `POST` | `/api/vehicles` | Bearer | `201` vehicle | `401`, `422` invalid input |
| `GET` | `/api/vehicles` | Bearer | `200` list of all vehicles, ordered by id | `401` |
| `GET` | `/api/vehicles/search` | Bearer | `200` list of matching vehicles | `401`, `422` invalid or unknown parameter, or `min_price > max_price` |
| `PUT` | `/api/vehicles/{id}` | Bearer | `200` updated vehicle | `401`, `404` unknown id, `422` invalid value or `null` |
| `DELETE` | `/api/vehicles/{id}` | Bearer, admin | `204` no body | `401`, `403` not an admin, `404` unknown id |
| `POST` | `/api/vehicles/{id}/purchase` | Bearer | `200` vehicle with quantity reduced by 1 | `400` out of stock, `401`, `404` unknown id |
| `POST` | `/api/vehicles/{id}/restock` | Bearer, admin | `200` vehicle with quantity increased | `401`, `403` not an admin, `404` unknown id, `422` quantity below 1 |

Search parameters, all optional: `make`, `model` (partial, case-insensitive), `category` (exact), `min_price`, `max_price` (inclusive). Example: `/api/vehicles/search?make=toy&category=Sedan&max_price=2500000`.

Restock body: `{"quantity": 5}`. Purchase takes no body.

Interactive docs: http://localhost:8000/docs. Log in, then use **Authorize** and paste the token.

Browsers may only call the API from the origins in `CORS_ORIGINS` (see Setup).

## Tests

| Suite | Tools | Tests | Coverage |
|---|---|---|---|
| Backend | pytest, FastAPI `TestClient`, a temporary SQLite database per test | 127 | 98% |
| Frontend | Vitest, React Testing Library, MSW (mocked API) | 106 | 95% of statements |

```bash
cd backend && pytest
cd backend && pytest --cov=app --cov-report=term-missing   # with coverage
cd frontend && npm run test:run
cd frontend && npm run coverage                            # with coverage
```

## Screenshots

_TODO_

## My AI Usage

### Phase 1 – Authentication

I used AI to help understand the authentication flow, including password hashing, JWT authentication, database access, and error handling. I wrote and ran tests to verify the expected behaviour, investigated failures, and used the Red–Green–Refactor cycle to implement and improve the solution.

### Phase 2 – Vehicle Management

I used AI as a pair-programming assistant to plan test scenarios, identify edge cases, and review the vehicle API's behaviour. I followed a test-first approach for creating, listing, searching, updating, and deleting vehicles, including validation, authentication, and admin permissions. I ran the test suite and lint checks, reviewed the results, and refined the tests to make sure they verified the intended behaviour rather than just passing.

### Phase 3 – Purchase and Restock

I used AI to plan the purchase and restock endpoints and to explain how to stop overselling. I wrote the first purchase tests, then saw the "read, check, save" version could sell the last car twice, so I refactored it into one conditional SQL update while keeping every test green. With the deadline close, I asked AI to write the remaining tests and code (purchase 404 and the restock rules) from my scenarios, and I reviewed each test before committing. I deliberately cut optional extras, such as a concurrency test and global exception handlers, to keep time for the frontend.

I used Claude as a pair-programming partner to understand and implement purchase and restock workflows. At my request, Claude helped write tests and code, which I reviewed and verified through test runs. This phase helped me understand atomic database updates and safe inventory management.

### Phase 4 – Frontend

I used Claude as a pair-programming partner to build the React frontend, write tests and connect it to the FastAPI backend. I reviewed the implementation and used tests, build and lint checks, and browser testing to identify and fix issues. This helped me understand frontend-backend integration and the importance of verifying AI-generated code.
