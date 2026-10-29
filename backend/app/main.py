"""FastAPI application entry point. Run with: uvicorn app.main:app --reload"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, vehicles
from app.core.config import get_settings

app = FastAPI(title="Car Dealership Inventory API")

#main.py is the entry point that uvicorn runs.. 
#it creates the fastapi app object and attaches CORS so the React app on port 5173 is allowed to call the API from the browser
#and includes the auth and vehicle routers.
#credentials r off because the token travels in a header, not a cookie
#cors is enforced by browser and tests can pass without it for the same reason
#cors is not a security, the real protection is JWT
#health is my first TDD test which proved the pytest and the test client were wired correctly
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
