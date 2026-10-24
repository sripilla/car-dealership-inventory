"""FastAPI application entry point. Run with: uvicorn app.main:app --reload"""

from fastapi import FastAPI

app = FastAPI(title="Car Dealership Inventory API")
