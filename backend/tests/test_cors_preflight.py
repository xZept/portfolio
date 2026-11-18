from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import create_app


def _preflight_headers(origin: str) -> dict[str, str]:
    return {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }


def test_cors_preflight_allows_localhost_and_loopback_by_default(monkeypatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("FRONTEND_PUBLIC_URL", raising=False)
    get_settings.cache_clear()

    settings = Settings(_env_file=None)
    assert settings.cors_origin_list == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Rebuild app with isolated settings by overriding cors_origins via env
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    get_settings.cache_clear()
    client = TestClient(create_app())

    for origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
        for path in ("/api/v1/ask-resume/stream", "/api/v1/contact"):
            response = client.options(path, headers=_preflight_headers(origin))
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == origin

    get_settings.cache_clear()


def test_cors_preflight_normalizes_trailing_slashes_and_frontend_public_url(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000/, http://127.0.0.1:3000/")
    monkeypatch.setenv("FRONTEND_PUBLIC_URL", "https://portfolio.example.com/subpath/")
    get_settings.cache_clear()

    client = TestClient(create_app())

    for origin in (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://portfolio.example.com",
    ):
        for path in ("/api/v1/ask-resume/stream", "/api/v1/contact"):
            response = client.options(path, headers=_preflight_headers(origin))
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == origin

    get_settings.cache_clear()


def test_cors_preflight_rejects_disallowed_origin(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    monkeypatch.delenv("FRONTEND_PUBLIC_URL", raising=False)
    get_settings.cache_clear()

    client = TestClient(create_app())

    for path in ("/api/v1/ask-resume/stream", "/api/v1/contact"):
        response = client.options(path, headers=_preflight_headers("https://evil.example.com"))
        assert response.status_code == 400
        assert "Disallowed CORS origin" in response.text

    get_settings.cache_clear()
