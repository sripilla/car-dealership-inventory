"""FastAPI application entry point. Run with: uvicorn app.main:app --reload"""

from fastapi import FastAPI

from app.api.routes import auth

app = FastAPI(title="Car Dealership Inventory API")

app.include_router(auth.router)

@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness check, used to prove the app and test setup work."""
    return {"status": "ok"}
