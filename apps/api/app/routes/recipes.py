from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import SessionLocal, Base, engine
from ..models import Recipe
from ..schemas import RecipeCreate, RecipeOut
from ..auth_guard import require_auth_dependency
from ..pdf import export_recipe_pdf
import uuid, os

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

router = APIRouter()

@router.get("/dbcheck")
def dbcheck(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"db":"ok"}

@router.get("/me")
def me(claims: dict = Depends(require_auth_dependency)):
    return {"sub": claims["sub"]}

@router.get("/recipes", response_model=list[RecipeOut])
def list_recipes(claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    rows = db.execute(select(Recipe).where(Recipe.owner_sub == claims["sub"]).order_by(Recipe.created_at.desc())).scalars().all()
    return [to_out(r) for r in rows]

@router.post("/recipes", response_model=RecipeOut)
def create_recipe(payload: RecipeCreate, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = Recipe(owner_sub=claims["sub"], **payload.model_dump())
    db.add(r); db.commit(); db.refresh(r)
    return to_out(r)

@router.get("/recipes/{rid}", response_model=RecipeOut)
def get_recipe(rid: str, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = db.get(Recipe, rid)
    if not r or r.owner_sub != claims["sub"]:
        raise HTTPException(404, "Not found")
    return to_out(r)

@router.post("/recipes/{rid}/export-pdf")
def export_pdf(rid: str, body: dict, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = db.get(Recipe, rid)
    if not r or r.owner_sub != claims["sub"]:
        raise HTTPException(404, "Not found")
    filename = export_recipe_pdf(to_dict(r), style=body.get("style","minimal"), paper=body.get("paper","Letter"))
    base = os.getenv("FILES_DIR", "/tmp")
    return {"url": f"/files/{filename}", "path": f"{base}/{filename}"}

@router.get("/files/{filename}")
def serve_file(filename: str):
    base = os.getenv("FILES_DIR", "/tmp")
    path = os.path.join(base, filename)
    if not os.path.exists(path): raise HTTPException(404, "Not found")
    from fastapi.responses import FileResponse
    return FileResponse(path, media_type="application/pdf")

@router.post("/recipes/{rid}/share")
def toggle_share(rid: str, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = db.get(Recipe, rid)
    if not r or r.owner_sub != claims["sub"]:
        raise HTTPException(404, "Not found")
    if r.visibility == "private":
        r.visibility = "public"; r.public_token = r.public_token or str(uuid.uuid4())
    else:
        r.visibility = "private"; r.public_token = None
    db.add(r); db.commit(); db.refresh(r)
    return {"visibility": r.visibility, "public_token": r.public_token}

@router.get("/public/r/{token}", response_model=RecipeOut)
def public_view(token: str, db: Session = Depends(get_db)):
    r = db.execute(select(Recipe).where(Recipe.public_token == token, Recipe.visibility == "public")).scalar_one_or_none()
    if not r: raise HTTPException(404, "Not found")
    return to_out(r)

def to_out(r: Recipe) -> RecipeOut:
    return RecipeOut(
      id=str(r.id), title=r.title, servings=r.servings,
      prep_minutes=r.prep_minutes, cook_minutes=r.cook_minutes,
      ingredients=r.ingredients, instructions=r.instructions,
      cuisine=r.cuisine, meal_type=r.meal_type, dietary_tags=r.dietary_tags,
      notes=r.notes, visibility=r.visibility, public_token=r.public_token
    )

def to_dict(r: Recipe) -> dict:
    return {
      "id": str(r.id), "title": r.title, "servings": r.servings,
      "ingredients": r.ingredients or [], "instructions": r.instructions or []
    }

