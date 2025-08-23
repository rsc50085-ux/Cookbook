import os, time, requests
from fastapi import Depends, HTTPException, Request
from authlib.jose import JsonWebToken, JsonWebKey

TESTING = os.getenv("TESTING") == "1"
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")

_jwks_cache: dict[str, object] | None = None
_jwks_exp: float = 0.0

def _get_jwks() -> dict:
    global _jwks_cache, _jwks_exp
    now = time.time()
    if _jwks_cache and now < _jwks_exp:
        return _jwks_cache  # type: ignore
    if not AUTH0_DOMAIN:
        raise HTTPException(500, "Auth0 domain missing")
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    r = requests.get(url, timeout=10)
    if r.status_code != 200:
        raise HTTPException(503, "Unable to fetch JWKS")
    _jwks_cache = r.json()
    _jwks_exp = now + 3600
    return _jwks_cache  # type: ignore

def _verify_bearer(bearer: str) -> dict:
    if not bearer or not bearer.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = bearer.split(" ", 1)[1].strip()
    jwks = JsonWebKey.import_key_set(_get_jwks())
    jwt = JsonWebToken(["RS256"])
    try:
        claims = jwt.decode(
            token,
            jwks,
            claims_options={
                "aud": {"essential": True, "values": [AUTH0_AUDIENCE]},
                "iss": {"essential": True, "values": [f"https://{AUTH0_DOMAIN}/"]},
            },
        )
        claims.validate()
        return dict(claims)
    except Exception:
        raise HTTPException(401, "Invalid token")

def require_auth_dependency(request: Request):
    if TESTING:
        return {"sub": "test-user"}
    authz = request.headers.get("authorization", "")
    return _verify_bearer(authz)


