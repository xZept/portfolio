from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    service_name: str = "allen-portfolio-rag-api"
    service_version: str = "1.0.0"
    gemini_api_key: str = Field(default="")
    supabase_db_url: str = Field(default="")
    cors_origins: str = Field(default="http://localhost:3000")
    gemini_model: str = Field(default="gemini-3.5-flash-lite")
    embedding_model: str = Field(default="gemini-embedding-2")

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return origins or ["http://localhost:3000"]

    @property
    def rag_configured(self) -> bool:
        return bool(self.gemini_api_key.strip() and self.supabase_db_url.strip())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
