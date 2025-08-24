from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from .routes import misc, recipes
import time, logging, uuid, json

app = FastAPI(title="Cookbook API")
origins = [o.strip() for o in os.getenv("CORS_ORIGINS","").split(",") if o.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_headers=["*"], allow_methods=["*"], allow_credentials=True)

logger = logging.getLogger("cookbook.api")
logging.basicConfig(level=logging.INFO, format="%(message)s")

REDACT_HEADERS = {"authorization", "cookie", "set-cookie"}

def _redact_headers(headers: list[tuple[str,str]]):
    out = {}
    for k, v in headers:
        lk = k.lower()
        if lk in REDACT_HEADERS:
            out[lk] = "[redacted]"
        else:
            out[lk] = v
    return out

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    started = time.time()
    rid = request.headers.get("x-request-id") or str(uuid.uuid4())
    body_preview = None
    try:
        body = await request.body()
        if body:
            body_preview = (body[:2048]).decode(errors="ignore")
    except Exception:
        body_preview = None
    try:
        response = await call_next(request)
        duration_ms = int((time.time() - started) * 1000)
        log = {
            "level": "info",
            "request_id": rid,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "headers": _redact_headers(list(request.headers.items())),
            "body_preview": body_preview,
        }
        logger.info(json.dumps(log))
        response.headers["x-request-id"] = rid
        return response
    except Exception as e:
        duration_ms = int((time.time() - started) * 1000)
        log = {
            "level": "error",
            "request_id": rid,
            "method": request.method,
            "path": request.url.path,
            "error": str(e),
            "duration_ms": duration_ms,
        }
        logger.error(json.dumps(log))
        raise

app.include_router(misc.router)
app.include_router(recipes.router)


