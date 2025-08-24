from pydantic import BaseModel, Field
from typing import List, Optional, Any

class RecipeCreate(BaseModel):
    title: str
    servings: int = 1
    prep_minutes: Optional[int] = None
    cook_minutes: Optional[int] = None
    ingredients: List[Any] = Field(default_factory=list)
    instructions: List[str] = Field(default_factory=list)
    cuisine: Optional[str] = None
    meal_type: Optional[str] = None
    dietary_tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class RecipeOut(RecipeCreate):
    id: str
    visibility: str
    public_token: Optional[str] = None




