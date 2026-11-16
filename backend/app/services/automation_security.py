from __future__ import annotations

import hashlib
import hmac
import re
import time

from fastapi import Depends, HTTPException, Request, status

from app.config import Settings, get_settings

REPLAY_WINDOW_SECONDS = 300
_INTEGER_TIMESTAMP_PATTERN = re.compile(r"^\d+$")


def compute_automation_signature(
    secret: str,
    timestamp: int | str,
    raw_body: str | bytes,
) -> str:
    """Compute canonical sha256=<hex> HMAC-SHA256 signature over '{timestamp}.{raw_body}'."""
    body_bytes = (
        raw_body.encode("utf-8") if isinstance(raw_body, str) else bytes(raw_body)
    )
    signing_bytes = f"{timestamp}.".encode("utf-8") + body_bytes
    digest = hmac.new(secret.encode("utf-8"), signing_bytes, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


async def verify_automation_signature(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    """Authenticate /api/v1/automation/* callbacks with timestamped HMAC-SHA256 verification."""
    secret = settings.automation_webhook_secret.strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTOMATION_WEBHOOK_SECRET is not configured.",
        )

    timestamp_header = request.headers.get("X-Automation-Timestamp")
    if not timestamp_header or not timestamp_header.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Automation-Timestamp header.",
        )

    timestamp_str = timestamp_header.strip()
    if not _INTEGER_TIMESTAMP_PATTERN.fullmatch(timestamp_str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Automation-Timestamp must be a valid Unix epoch integer.",
        )

    timestamp_val = int(timestamp_str)
    now_epoch = int(time.time())
    if abs(now_epoch - timestamp_val) > REPLAY_WINDOW_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Automation-Timestamp is outside the 300-second replay window.",
        )

    signature_header = request.headers.get("X-Automation-Signature")
    if not signature_header or not signature_header.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Automation-Signature header.",
        )

    raw_body = await request.body()
    expected_signature = compute_automation_signature(secret, timestamp_str, raw_body)
    if not hmac.compare_digest(signature_header.strip(), expected_signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid X-Automation-Signature digest.",
        )
