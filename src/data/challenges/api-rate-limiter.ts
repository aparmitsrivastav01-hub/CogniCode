import type { Challenge } from '../../types/round';

const clockPy = `class SimulatedClock:
    """Injectable deterministic clock for time-dependent components."""

    def __init__(self, start_time: float = 1000.0) -> None:
        self._current_time = float(start_time)

    def now(self) -> float:
        return self._current_time

    def advance(self, seconds: float) -> None:
        if seconds < 0:
            raise ValueError("Clock cannot move backwards")
        self._current_time += float(seconds)
`;

const modelsPy = `from dataclasses import dataclass

@dataclass(frozen=True)
class ClientRequest:
    user_id: str
    path: str
    cost: int = 1

@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining_tokens: int
`;

const buggyBucketPy = `class TokenBucket:
    """Token bucket rate limiter that refills tokens based on elapsed time."""

    def __init__(self, capacity: int, refill_rate_per_sec: float, last_refill_time: float) -> None:
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.rate = float(refill_rate_per_sec)
        self.last_refill = float(last_refill_time)

    def refill(self, current_time: float) -> None:
        elapsed = current_time - self.last_refill
        if elapsed <= 0:
            return
        tokens_to_add = int(elapsed * self.rate)
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = current_time

    def consume(self, count: int, current_time: float) -> bool:
        self.refill(current_time)
        if self.tokens >= count:
            self.tokens -= count
            return True
        return False
`;

const fixedBucketPy = `class TokenBucket:
    """Token bucket rate limiter that refills tokens based on elapsed time."""

    def __init__(self, capacity: int, refill_rate_per_sec: float, last_refill_time: float) -> None:
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.rate = float(refill_rate_per_sec)
        self.last_refill = float(last_refill_time)

    def refill(self, current_time: float) -> None:
        elapsed = current_time - self.last_refill
        if elapsed <= 0:
            return
        tokens_to_add = elapsed * self.rate
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = current_time

    def consume(self, count: int, current_time: float) -> bool:
        self.refill(current_time)
        if self.tokens >= count:
            self.tokens -= count
            return True
        return False
`;

const limiterPy = `from .bucket import TokenBucket
from .clock import SimulatedClock
from .models import RateLimitResult

class RateLimiterService:
    """Manages per-user token buckets and enforces rate limits."""

    def __init__(self, clock: SimulatedClock, default_capacity: int = 3, refill_rate: float = 1.0) -> None:
        self.clock = clock
        self.default_capacity = default_capacity
        self.refill_rate = refill_rate
        self._buckets: dict[str, TokenBucket] = {}

    def allow_request(self, user_id: str, cost: int = 1) -> RateLimitResult:
        now = self.clock.now()
        # TODO: clean up stale buckets when user has been idle for over an hour
        if user_id not in self._buckets:
            self._buckets[user_id] = TokenBucket(
                capacity=self.default_capacity,
                refill_rate_per_sec=self.refill_rate,
                last_refill_time=now,
            )
        bucket = self._buckets[user_id]
        allowed = bucket.consume(cost, now)
        return RateLimitResult(
            allowed=allowed,
            remaining_tokens=int(bucket.tokens),
        )
`;

const middlewarePy = `from .limiter import RateLimiterService
from .models import ClientRequest

class RateLimitMiddleware:
    """HTTP middleware checking API request rate allowances."""

    def __init__(self, limiter: RateLimiterService) -> None:
        self.limiter = limiter

    def handle_request(self, request: ClientRequest) -> str:
        result = self.limiter.allow_request(request.user_id, request.cost)
        if result.allowed:
            return f"200 OK: {request.path} (remaining: {result.remaining_tokens})"
        return f"429 Too Many Requests: {request.user_id} on {request.path}"
`;

const mainPy = `from app.clock import SimulatedClock
from app.limiter import RateLimiterService
from app.middleware import RateLimitMiddleware
from app.models import ClientRequest

def run_simulation() -> None:
    clock = SimulatedClock(start_time=100.0)
    limiter = RateLimiterService(clock, default_capacity=3, refill_rate=1.0)
    middleware = RateLimitMiddleware(limiter)

    print("Step 1: Burst 3 requests at t=100.0")
    for i in range(1, 4):
        req = ClientRequest(user_id="user_alpha", path=f"/api/v1/resource/{i}")
        print(f"Req {i}: {middleware.handle_request(req)}")

    print("\\nStep 2: Send 4 requests spaced 0.5s apart")
    for i in range(4, 8):
        clock.advance(0.5)
        req = ClientRequest(user_id="user_alpha", path=f"/api/v1/resource/{i}")
        t = clock.now() - 100.0
        print(f"Req {i} at +{t:.1f}s: {middleware.handle_request(req)}")

if __name__ == "__main__":
    run_simulation()
`;

const testLimiterPy = `import unittest
from app.clock import SimulatedClock
from app.limiter import RateLimiterService
from app.models import ClientRequest

class TestRateLimiter(unittest.TestCase):
    def test_burst_allowed(self) -> None:
        clock = SimulatedClock(10.0)
        limiter = RateLimiterService(clock, default_capacity=3, refill_rate=1.0)
        self.assertTrue(limiter.allow_request("u1").allowed)
        self.assertTrue(limiter.allow_request("u1").allowed)
        self.assertTrue(limiter.allow_request("u1").allowed)
        self.assertFalse(limiter.allow_request("u1").allowed)

    def test_fractional_refill_accumulates(self) -> None:
        clock = SimulatedClock(10.0)
        limiter = RateLimiterService(clock, default_capacity=2, refill_rate=1.0)
        limiter.allow_request("u2")
        limiter.allow_request("u2")
        # Bucket is empty now
        # Advance 0.5s twice: total 1.0s -> 1 token must refill
        clock.advance(0.5)
        self.assertFalse(limiter.allow_request("u2").allowed)
        clock.advance(0.5)
        self.assertTrue(limiter.allow_request("u2").allowed)

if __name__ == "__main__":
    unittest.main()
`;

export const apiRateLimiterChallenge: Challenge = {
  id: 'api-rate-limiter',
  slug: 'api-rate-limiter',
  title: 'Rate Limiter That Blocks Users Too Soon',
  category: 'Debugging',
  difficulty: 'Medium',
  estimatedMinutes: 12,
  tags: ['Rate Limiting', 'Tokens', 'State'],
  entryFile: 'app/main.py',
  summary: 'A token bucket rate limiter protects an API by tracking request allowances with a simulated clock.',
  story:
    'Our API rate limiter uses a token bucket to allow bursts while enforcing a steady request rate. A mobile client team reported that users making slow, spaced-out requests are suddenly blocked with HTTP 429 Too Many Requests. The middleware logs show that user buckets are not refilling at the expected rate between requests. Tracing the request lifecycle across the clock, bucket, and middleware will reveal why tokens are lost.',
  description:
    'Our API rate limiter uses a token bucket to allow bursts while enforcing a steady request rate. A mobile client team reported that users making slow, spaced-out requests are suddenly blocked with HTTP 429 Too Many Requests. The middleware logs show that user buckets are not refilling at the expected rate between requests. Tracing the request lifecycle across the clock, bucket, and middleware will reveal why tokens are lost.',
  expectedInvariants: [
    'Must allow requests when tokens are available in the user bucket.',
    'Must refill tokens continuously based on elapsed time between requests.',
    'Must not prematurely reject spaced-out requests that stay under the rate limit.',
  ],
  expectedBehaviour: [
    'Must allow requests when tokens are available in the user bucket.',
    'Must refill tokens continuously based on elapsed time between requests.',
    'Must not prematurely reject spaced-out requests that stay under the rate limit.',
  ],
  bug: {
    file: 'app/bucket.py',
    line: 16,
  },
  fix: {
    file: 'app/bucket.py',
    line: 16,
    newText: '        tokens_to_add = elapsed * self.rate',
  },
  decoy: {
    text: 'Check the default capacity handling in app/limiter.py line 19; new buckets might be initialized with zero tokens.',
    pointsTo: 'app/limiter.py',
  },
  assistantHints: [
    {
      id: 'limiter-hint-1',
      text: 'The RateLimiterService in app/limiter.py has a suspicious TODO comment around idle bucket cleanup.',
      pointsTo: 'app/limiter.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
    {
      id: 'limiter-hint-2',
      text: 'Look at how tokens_to_add is computed during refill in app/bucket.py when elapsed is less than one full second.',
      pointsTo: 'app/bucket.py',
      isDecoy: false,
      recommendedChoice: 'trust',
    },
    {
      id: 'limiter-hint-3',
      text: 'The RateLimitMiddleware in app/middleware.py might be formatting HTTP status 429 responses improperly.',
      pointsTo: 'app/middleware.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
  ],
  hints: [
    'Observe how much simulated time passes between the requests in Step 2 of the simulation.',
    'Check whether the refill calculation can ever add fractional tokens or if small time slices are discarded.',
    'In app/bucket.py line 16, int(elapsed * self.rate) truncates any elapsed interval under 1.0 second to 0.',
  ],
  explainRubric: [
    'Identifies that refill() truncates fractional tokens using int().',
    'Explains that frequent requests under 1 second reset last_refill without adding any tokens.',
    'States that keeping tokens as a continuous float allows fractional refill accumulation.',
  ],
  files: [
    { path: 'app/clock.py', language: 'python', content: clockPy },
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/bucket.py', language: 'python', content: buggyBucketPy },
    { path: 'app/limiter.py', language: 'python', content: limiterPy },
    { path: 'app/middleware.py', language: 'python', content: middlewarePy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_limiter.py', language: 'python', content: testLimiterPy },
    { path: 'tests/test_cart.py', language: 'python', content: testLimiterPy },
  ],
  fixedFile: {
    path: 'app/bucket.py',
    content: fixedBucketPy,
  },
  expectedOutput: {
    buggy: `Step 1: Burst 3 requests at t=100.0
Req 1: 200 OK: /api/v1/resource/1 (remaining: 2)
Req 2: 200 OK: /api/v1/resource/2 (remaining: 1)
Req 3: 200 OK: /api/v1/resource/3 (remaining: 0)

Step 2: Send 4 requests spaced 0.5s apart
Req 4 at +0.5s: 429 Too Many Requests: user_alpha on /api/v1/resource/4
Req 5 at +1.0s: 429 Too Many Requests: user_alpha on /api/v1/resource/5
Req 6 at +1.5s: 429 Too Many Requests: user_alpha on /api/v1/resource/6
Req 7 at +2.0s: 429 Too Many Requests: user_alpha on /api/v1/resource/7`,
    fixed: `Step 1: Burst 3 requests at t=100.0
Req 1: 200 OK: /api/v1/resource/1 (remaining: 2)
Req 2: 200 OK: /api/v1/resource/2 (remaining: 1)
Req 3: 200 OK: /api/v1/resource/3 (remaining: 0)

Step 2: Send 4 requests spaced 0.5s apart
Req 4 at +0.5s: 429 Too Many Requests: user_alpha on /api/v1/resource/4
Req 5 at +1.0s: 200 OK: /api/v1/resource/5 (remaining: 0)
Req 6 at +1.5s: 429 Too Many Requests: user_alpha on /api/v1/resource/6
Req 7 at +2.0s: 200 OK: /api/v1/resource/7 (remaining: 0)`,
  },
  modelExplanation:
    'In app/bucket.py, the refill method calculates new tokens using int(elapsed * self.rate). When requests arrive at intervals less than one second (such as every 0.5s), int(0.5 * 1.0) truncates to 0. Because self.last_refill is updated to current_time on every call, the elapsed fractional time is permanently lost, preventing the bucket from ever refilling.',
};
