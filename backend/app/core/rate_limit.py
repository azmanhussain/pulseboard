from fastapi import Request, HTTPException, status
from app.core.redis_client import redis_client

RATE_LIMIT_MAX_REQUESTS = 100
RATE_LIMIT_WINDOW_SECONDS = 60


async def rate_limit_middleware(request: Request, call_next):
    # Identify the caller — prefer the authenticated user if available, else fall back to IP.
    # (At middleware time, we don't have easy access to the resolved User object from
    # get_current_user, so we parse the raw Authorization header ourselves as a lightweight
    # proxy for "who is this" — it doesn't need to be as strict as real auth here, since
    # invalid/missing tokens will get their own 401 further down the request pipeline anyway.)
    identifier = request.headers.get("Authorization", request.client.host)

    redis_key = f"ratelimit:{identifier}"
    current = await redis_client.incr(redis_key)
    if current == 1:
        # First request in this window — set the expiry now so the counter resets after the window.
        await redis_client.expire(redis_key, RATE_LIMIT_WINDOW_SECONDS)

    if current > RATE_LIMIT_MAX_REQUESTS:
        ttl = await redis_client.ttl(redis_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
        )

    return await call_next(request)