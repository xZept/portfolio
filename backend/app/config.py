from functools import lru_cache
from urllib.parse import urlsplit
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
    supabase_url: str = Field(default="")
    supabase_service_role_key: str = Field(default="")
    cors_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")
    gemini_model: str = Field(default="gemini-3.5-flash-lite")
    embedding_model: str = Field(default="gemini-embedding-2")
    automation_webhook_secret: str = Field(default="")
    n8n_contact_webhook_url: str = Field(default="")
    discord_webhook_url: str = Field(default="")
    frontend_public_url: str = Field(default="")
    backend_public_url: str = Field(default="")

    @staticmethod
    def _normalize_origin(raw_origin: str) -> str:
        """Strip whitespace/trailing slashes and reduce URLs to scheme://host[:port]."""
        cleaned = raw_origin.strip().rstrip("/")
        if not cleaned or cleaned == "*":
            return cleaned
        parsed = urlsplit(cleaned)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
        return cleaned

    @property
    def cors_origin_list(self) -> list[str]:
        candidates = [item for item in self.cors_origins.split(",") if item.strip()]
        if self.frontend_public_url.strip():
            candidates.append(self.frontend_public_url)

        origins: list[str] = []
        seen: set[str] = set()
        for candidate in candidates:
            normalized = self._normalize_origin(candidate)
            if normalized and normalized not in seen:
                seen.add(normalized)
                origins.append(normalized)

        return origins or ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def rag_configured(self) -> bool:
        return bool(self.gemini_api_key.strip() and self.supabase_db_url.strip())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
