"""FastAPI application entry point. Run with: uvicorn app.main:app --reload"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, vehicles
from app.core.config import get_settings

app = FastAPI(title="Car Dealership Inventory API")

# The React app is served from a different origin (port 5173 in development),
# so the browser blocks its requests unless the API allows that origin.
# A fixed list, not "*": only our own frontend may call the API from a browser.
# No cookies are used (the JWT goes in the Authorization header), so
# allow_credentials stays False.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness check, used to prove the app and test setup work."""
    return {"status": "ok"}
