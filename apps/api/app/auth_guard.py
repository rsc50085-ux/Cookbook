import os
from fastapi import Depends, HTTPException

TESTING = os.getenv("TESTING") == "1"

def require_auth_dependency():
    if TESTING:
        return {"sub": "test-user"}
    # Minimal fallback for non-testing: reject without real JWT wiring
    raise HTTPException(status_code=401, detail="Unauthorized")


