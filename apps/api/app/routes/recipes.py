from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import SessionLocal, Base, engine
from ..models import Recipe
from ..schemas import RecipeCreate, RecipeOut
from ..auth_guard import require_auth_dependency
from ..pdf import export_recipe_pdf
import uuid, os, shutil
from pathlib import Path

# Ensure database schema is up to date
try:
    Base.metadata.create_all(bind=engine)
    # Add photo_url column if it doesn't exist (migration)
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE recipes ADD COLUMN photo_url VARCHAR"))
            conn.commit()
        except Exception:
            # Column already exists or other error, ignore
            pass
except Exception as e:
    print(f"Database setup error: {e}")

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
    import logging
    logger = logging.getLogger("cookbook.api")
    
    try:
        logger.info(f"Creating recipe for user {claims['sub']}")
        logger.info(f"Recipe data: {payload.model_dump()}")
        
        r = Recipe(owner_sub=claims["sub"], **payload.model_dump())
        db.add(r)
        db.commit()
        db.refresh(r)
        
        logger.info(f"Recipe created successfully with ID: {r.id}")
        return to_out(r)
    except Exception as e:
        logger.error(f"Recipe creation failed: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Failed to create recipe: {str(e)}")

@router.get("/recipes/{rid}", response_model=RecipeOut)
def get_recipe(rid: str, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = db.get(Recipe, rid)
    if not r or r.owner_sub != claims["sub"]:
        raise HTTPException(404, "Not found")
    return to_out(r)

@router.put("/recipes/{rid}", response_model=RecipeOut)
def update_recipe(rid: str, payload: RecipeCreate, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger("cookbook.api")
    
    try:
        logger.info(f"Updating recipe {rid} for user {claims['sub']}")
        logger.info(f"Update data: {payload.model_dump()}")
        
        r = db.get(Recipe, rid)
        if not r or r.owner_sub != claims["sub"]:
            raise HTTPException(404, "Not found")
        
        # Update all fields from payload
        for field, value in payload.model_dump().items():
            setattr(r, field, value)
        
        db.add(r)
        db.commit()
        db.refresh(r)
        
        logger.info(f"Recipe {rid} updated successfully")
        return to_out(r)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recipe update failed: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Failed to update recipe: {str(e)}")

@router.delete("/recipes/{rid}")
def delete_recipe(rid: str, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger("cookbook.api")
    
    try:
        logger.info(f"Deleting recipe {rid} for user {claims['sub']}")
        
        r = db.get(Recipe, rid)
        if not r or r.owner_sub != claims["sub"]:
            raise HTTPException(404, "Not found")
        
        db.delete(r)
        db.commit()
        
        logger.info(f"Recipe {rid} deleted successfully")
        return {"message": "Recipe deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recipe deletion failed: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Failed to delete recipe: {str(e)}")

@router.post("/recipes/{rid}/export-pdf")
def export_pdf(rid: str, body: dict, claims: dict = Depends(require_auth_dependency), db: Session = Depends(get_db)):
    r = db.get(Recipe, rid)
    if not r or r.owner_sub != claims["sub"]:
        raise HTTPException(404, "Not found")
    filename = export_recipe_pdf(to_dict(r), style=body.get("style","minimal"), paper=body.get("paper","Letter"))
    base = os.getenv("FILES_DIR", "/tmp")
    return {"url": f"/files/{filename}", "path": f"{base}/{filename}"}

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...), claims: dict = Depends(require_auth_dependency)):
    import logging
    logger = logging.getLogger("cookbook.api")
    
    try:
        logger.info(f"Upload attempt - filename: {file.filename}, content_type: {file.content_type}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(400, "File must be an image")
        
        # Read content
        content = await file.read()
        logger.info(f"File read successfully, size: {len(content)} bytes")
        
        # Validate file size (max 5MB)
        if len(content) > 5 * 1024 * 1024:  # 5MB
            logger.warning(f"File too large: {len(content)} bytes")
            raise HTTPException(400, "File too large (max 5MB)")
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        logger.info(f"Generated filename: {filename}")
        
        # Save file
        base_dir = os.getenv("FILES_DIR", "/tmp")
        photos_dir = Path(base_dir) / "photos"
        photos_dir.mkdir(exist_ok=True)
        
        file_path = photos_dir / filename
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"File saved successfully: {file_path}")
        return {"photo_url": f"/photos/{filename}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

@router.get("/photos/{filename}")
def serve_photo(filename: str):
    base = os.getenv("FILES_DIR", "/tmp")
    path = os.path.join(base, "photos", filename)
    if not os.path.exists(path): raise HTTPException(404, "Not found")
    from fastapi.responses import FileResponse
    import mimetypes
    media_type = mimetypes.guess_type(path)[0] or "image/jpeg"
    return FileResponse(path, media_type=media_type)

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
      notes=r.notes, photo_url=r.photo_url, visibility=r.visibility, public_token=r.public_token
    )

def to_dict(r: Recipe) -> dict:
    return {
      "id": str(r.id), "title": r.title, "servings": r.servings,
      "ingredients": r.ingredients or [], "instructions": r.instructions or []
    }

