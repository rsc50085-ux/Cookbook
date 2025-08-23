import os, shutil, pathlib
os.environ["TESTING"]="1"; os.environ["FILES_DIR"]="./_files"
from httpx import AsyncClient, ASGITransport
from app.main import app

import pytest
pathlib.Path("./_files").mkdir(exist_ok=True)

@pytest.mark.asyncio
async def test_recipe_crud_and_pdf():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {"title":"Test Pasta","servings":2,"ingredients":[{"qty":"200","unit":"g","name":"spaghetti"}],"instructions":["Boil","Serve"]}
        r = await ac.post("/recipes", json=payload); assert r.status_code == 200
        rid = r.json()["id"]
        r = await ac.get(f"/recipes/{rid}"); assert r.status_code == 200 and r.json()["title"]=="Test Pasta"
        r = await ac.post(f"/recipes/{rid}/export-pdf", json={"style":"minimal"}); assert r.status_code == 200
        url = r.json()["url"]; assert url.endswith(".pdf")
    shutil.rmtree("./_files", ignore_errors=True)


