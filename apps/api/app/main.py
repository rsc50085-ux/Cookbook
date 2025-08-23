from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .routes import misc, recipes

app = FastAPI(title="Cookbook API")
origins = [o.strip() for o in os.getenv("CORS_ORIGINS","").split(",") if o.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_headers=["*"], allow_methods=["*"], allow_credentials=True)

app.include_router(misc.router)
app.include_router(recipes.router)


