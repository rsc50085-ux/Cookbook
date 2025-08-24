import os
from sqlalchemy import create_engine
import logging
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# Ensure SQLAlchemy uses psycopg v3 driver on Render/Postgres
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+" not in DATABASE_URL.split("://", 1)[0]:
    # 'postgresql://' without explicit driver defaults to psycopg2; force psycopg v3
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
    echo=False,  # avoid logging parameters
)

# Route SQLAlchemy engine logs (no SQL parameter values) to our logger
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


