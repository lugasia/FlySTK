"""SQLAlchemy database setup — Supabase Postgres in production, SQLite for local dev."""
import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Build engine ──────────────────────────────────────────────────
PG_HOST = os.getenv("PG_HOST")

if PG_HOST:
    # Supabase via individual env vars (handles special chars in password)
    _user = quote_plus(os.getenv("PG_USER", "postgres"))
    _password = quote_plus(os.getenv("PG_PASSWORD", ""))
    _port = os.getenv("PG_PORT", "5432")
    _db = os.getenv("PG_DB", "postgres")
    _url = f"postgresql+pg8000://{_user}:{_password}@{PG_HOST}:{_port}/{_db}"
    import ssl as _ssl
    _ssl_ctx = _ssl.create_default_context()
    engine = create_engine(_url, pool_pre_ping=True,
                           connect_args={"ssl_context": _ssl_ctx})

elif os.getenv("DATABASE_URL"):
    engine = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)

else:
    # Local SQLite fallback — /tmp on Vercel (read-only filesystem)
    _local_db = os.path.join(os.path.dirname(__file__), "spectra.db")
    _db_path = "/tmp/spectra.db" if os.getenv("VERCEL") else _local_db
    engine = create_engine(
        f"sqlite:///{_db_path}",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_add_columns():
    """Add new columns to existing tables without dropping data."""
    from sqlalchemy import text, inspect
    with engine.connect() as conn:
        insp = inspect(engine)

        org_cols = {c["name"] for c in insp.get_columns("organizations")}
        if "is_demo" not in org_cols:
            conn.execute(text("ALTER TABLE organizations ADD COLUMN is_demo BOOLEAN DEFAULT false"))

        rsu_cols = {c["name"] for c in insp.get_columns("rsus")}
        if "manual_status" not in rsu_cols:
            conn.execute(text("ALTER TABLE rsus ADD COLUMN manual_status VARCHAR"))

        conn.commit()
