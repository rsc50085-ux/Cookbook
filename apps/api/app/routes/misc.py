from fastapi import APIRouter
import os
router = APIRouter()
@router.get("/healthz") 
def healthz(): return {"ok": True}

@router.get("/debug-env")
def debug_env():
    return {
        "AUTH0_DOMAIN": os.getenv("AUTH0_DOMAIN", "NOT_SET"),
        "AUTH0_AUDIENCE": os.getenv("AUTH0_AUDIENCE", "NOT_SET"),
        "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "NOT_SET"),
        "TESTING": os.getenv("TESTING", "NOT_SET")
    }




