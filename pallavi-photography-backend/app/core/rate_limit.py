import time
import os
from collections import defaultdict
from fastapi import HTTPException, Request, status

class InMemoryRateLimiter:
    """
    Lightweight, thread-safe (in the context of asyncio) sliding window rate limiter
    that tracks client IPs in memory. Does not require Redis or other external dependencies.
    """
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    async def __call__(self, request: Request):
        # Disable rate limiting during tests
        if os.getenv("TESTING") == "True":
            return

        # Determine client IP (using standard header X-Forwarded-For if behind a proxy)
        client_ip = request.headers.get("x-forwarded-for")
        if not client_ip:
            client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean up history for the client IP (remove timestamps outside the sliding window)
        timestamps = self.history[client_ip]
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self.history[client_ip] = valid_timestamps
        
        # Check limit
        if len(valid_timestamps) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many request attempts. Please try again later."
            )
        
        # Record this attempt
        self.history[client_ip].append(now)

# Export pre-configured limiters
login_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)      # 5 attempts per minute
refresh_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)   # 10 attempts per minute
