# Car Dealership Inventory System

## Overview

_TODO_

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

_TODO_

## API

_TODO_

## Tests

```bash
cd backend && pytest
cd frontend && npm run test:run
```

## Screenshots

_TODO_

## My AI Usage

_TODO_
