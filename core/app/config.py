"""
Configuration module — loads settings from environment variables.
Uses Pydantic Settings for validation and type coercion.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ---- PostgreSQL ----
    postgres_user: str = "komodo_user"
    postgres_password: str = "komodo_secure_password"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "komodo_db"

    @property
    def database_url(self) -> str:
        """Async database URL for SQLAlchemy + asyncpg."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync database URL for Alembic migrations."""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ---- Redis ----
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: str = "komodo_redis_password"

    @property
    def redis_url(self) -> str:
        return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/0"

    # ---- Application ----
    core_debug: bool = True
    core_log_level: str = "info"
    secret_key: str = "komodo-secret-key-change-me-in-production-64bytes"
    allowed_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:8081"

    # ---- Resilience ----
    seat_hold_ttl_seconds: int = 300  # 5 minutes
    search_cache_ttl_seconds: int = 120  # 2 minutes

    # ---- Database Pool (tuned for budget VPS) ----
    db_pool_size: int = 10
    db_max_overflow: int = 5
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800  # Recycle connections every 30 min


# Singleton instance
settings = Settings()
