import os, uuid, logging, json
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas

FILES_DIR = os.getenv("FILES_DIR", "/tmp")
os.makedirs(FILES_DIR, exist_ok=True)
logger = logging.getLogger("cookbook.api.pdf")

def export_recipe_pdf(recipe: dict, style: str="minimal", paper: str="Letter") -> str:
    filename = f"{uuid.uuid4()}.pdf"
    path = os.path.join(FILES_DIR, filename)
    pagesize = A4 if paper.lower() == "a4" else letter
    c = canvas.Canvas(path, pagesize=pagesize)
    width, height = pagesize

    y = height - 72
    if style == "artistic":
        c.setFont("Helvetica-Bold", 24); c.drawString(72, y, f"✿ {recipe['title']}"); y -= 36
        c.setFont("Helvetica", 12); c.drawString(72, y, f"Servings: {recipe.get('servings',1)}"); y -= 24
    else:
        c.setFont("Helvetica-Bold", 20); c.drawString(72, y, recipe["title"]); y -= 28
        c.setFont("Helvetica", 12); c.drawString(72, y, f"Servings: {recipe.get('servings',1)}"); y -= 24

    c.setFont("Helvetica-Bold", 14); c.drawString(72, y, "Ingredients"); y -= 18
    c.setFont("Helvetica", 11)
    for ing in recipe.get("ingredients", []):
        line = ing if isinstance(ing, str) else f"{ing.get('qty','')} {ing.get('unit','')} {ing.get('name','')}".strip()
        c.drawString(90, y, f"• {line}"); y -= 14
        if y < 72: c.showPage(); y = height - 72

    c.setFont("Helvetica-Bold", 14); c.drawString(72, y, "Instructions"); y -= 18
    c.setFont("Helvetica", 11)
    for i, step in enumerate(recipe.get("instructions", []), 1):
        c.drawString(90, y, f"{i}. {step}"); y -= 14
        if y < 72: c.showPage(); y = height - 72

    c.showPage(); c.save()
    try:
        logger.info(json.dumps({"level":"info","event":"pdf_export","recipe_title":recipe.get("title"),"filename":filename}))
    except Exception:
        pass
    return filename


