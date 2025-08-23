from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.sql import func
import uuid
from .db import Base

class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_sub = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    servings = Column(Integer, nullable=False, default=1)
    prep_minutes = Column(Integer, nullable=True)
    cook_minutes = Column(Integer, nullable=True)
    ingredients = Column(JSON, nullable=False, default=list)
    instructions = Column(JSON, nullable=False, default=list)
    cuisine = Column(String, nullable=True)
    meal_type = Column(String, nullable=True)
    dietary_tags = Column(JSON, nullable=False, default=list)
    notes = Column(String, nullable=True)
    visibility = Column(String, nullable=False, default="private")
    public_token = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


