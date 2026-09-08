import json
from fastapi import Request, HTTPException, status
from starlette.responses import JSONResponse

from app.core.redis_client import redis_client

IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60  # 24 hours


async def idempotency_middleware(request: Request, call_next):
    # Only mutating methods need protection — GET/HEAD/OPTIONS are naturally safe to retry.
    if request.method not in ("POST", "PATCH", "PUT", "DELETE"):
        return await call_next(request)

    idempotency_key = request.headers.get("Idempotency-Key")
    if not idempotency_key:
        return await call_next(request)  # header is optional — only enforced if the client sends one

    redis_key = f"idempotency:{idempotency_key}"
    cached = await redis_client.get(redis_key)
    if cached:
        cached_data = json.loads(cached)
        return JSONResponse(
            status_code=cached_data["status_code"],
            content=cached_data["body"],
            headers={"Idempotent-Replay": "true"},  # tells the client this was a cached response, not fresh
        )

    response = await call_next(request)

    # Only cache successful responses — a failed request (e.g. validation error)
    # should be safely retryable with different data, not permanently cached.
    if 200 <= response.status_code < 300:
        body_bytes = b""
        async for chunk in response.body_iterator:
            body_bytes += chunk

        try:
            body_json = json.loads(body_bytes)
        except json.JSONDecodeError:
            body_json = None

        await redis_client.set(
            redis_key,
            json.dumps({"status_code": response.status_code, "body": body_json}),
            ex=IDEMPOTENCY_TTL_SECONDS,
        )

        # We consumed the original body_iterator above, so rebuild the response
        # with the same bytes before returning it — otherwise the client gets an empty body.
        from starlette.responses import Response
        return Response(
            content=body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )

    return response