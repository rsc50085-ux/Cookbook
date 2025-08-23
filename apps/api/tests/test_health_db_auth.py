import os
os.environ["TESTING"]="1"
from httpx import AsyncClient, ASGITransport
from app.main import app

import pytest

@pytest.mark.asyncio
async def test_health_and_db():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/healthz"); assert r.status_code == 200 and r.json()["ok"] is True
        r = await ac.get("/dbcheck"); assert r.status_code == 200 and r.json()["db"] == "ok"

@pytest.mark.asyncio
async def test_me_requires_or_bypasses_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/me"); assert r.status_code in (200,401,403)


