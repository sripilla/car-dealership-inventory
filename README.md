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
cp .env.example .env            # then set a random SECRET_KEY
uvicorn app.main:app --reload   # API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                     # http://localhost:5173
```

## Design Decisions

Backend: FastAPI for building REST APIs.
Frontend: React with Vite for a separate, maintainable UI.
Configuration: Environment variables for application settings and secrets.
Testing: Test-Driven Development (TDD) using automated tests.
Version Control: Git and GitHub for tracking changes and maintaining commit history.

## API

Health check: http://localhost:8000/health
Swagger API docs: http://localhost:8000/docs

## Tests

```bash
cd backend && pytest
cd frontend && npm run test:run
```

## Screenshots

_TODO_

## My AI Usage

I used AI as a development assistant to clarify concepts and guide the implementation process. I checked the results of commands and tests as I worked. I intend to continue using a test-first approach, reviewing AI suggestions critically and ensuring that I understand the code I commit.
