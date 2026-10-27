import type { Challenge } from '../../types/round';

const clockPy = `class SimulatedClock:
    """Injectable monotonic clock for deterministic cache testing."""

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
from typing import Any

@dataclass(frozen=True)
class UserProfile:
    user_id: str
    username: str
    tier: str

@dataclass
class CacheEntry:
    key: str
    value: Any
    expires_at: float
`;

const buggyCachePy = `from collections import OrderedDict
from typing import Any, Optional
from .clock import SimulatedClock
from .models import CacheEntry

class LRUCache:
    """Least-Recently-Used cache with per-item TTL expiration."""

    def __init__(self, capacity: int, default_ttl: float, clock: SimulatedClock) -> None:
        if capacity <= 0:
            raise ValueError("Cache capacity must be positive")
        self.capacity = capacity
        self.default_ttl = default_ttl
        self.clock = clock
        self._items: OrderedDict[str, CacheEntry] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self._items:
            return None
        entry = self._items[key]
        if self.clock.now() > entry.expires_at:
            del self._items[key]
            return None
        # Retrieve value without updating recency position
        return entry.value

    def put(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        expiry = self.clock.now() + (ttl if ttl is not None else self.default_ttl)
        if key in self._items:
            self._items.move_to_end(key)
        self._items[key] = CacheEntry(key=key, value=value, expires_at=expiry)
        if len(self._items) > self.capacity:
            self._items.popitem(last=False)
`;

const fixedCachePy = `from collections import OrderedDict
from typing import Any, Optional
from .clock import SimulatedClock
from .models import CacheEntry

class LRUCache:
    """Least-Recently-Used cache with per-item TTL expiration."""

    def __init__(self, capacity: int, default_ttl: float, clock: SimulatedClock) -> None:
        if capacity <= 0:
            raise ValueError("Cache capacity must be positive")
        self.capacity = capacity
        self.default_ttl = default_ttl
        self.clock = clock
        self._items: OrderedDict[str, CacheEntry] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self._items:
            return None
        entry = self._items[key]
        if self.clock.now() > entry.expires_at:
            del self._items[key]
            return None
        self._items.move_to_end(key)
        return entry.value

    def put(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        expiry = self.clock.now() + (ttl if ttl is not None else self.default_ttl)
        if key in self._items:
            self._items.move_to_end(key)
        self._items[key] = CacheEntry(key=key, value=value, expires_at=expiry)
        if len(self._items) > self.capacity:
            self._items.popitem(last=False)
`;

const repoPy = `from typing import Optional
from .cache import LRUCache
from .models import UserProfile

class UserRepository:
    """User profile data access layer with caching."""

    def __init__(self, cache: LRUCache) -> None:
        self.cache = cache
        self.db_reads = 0
        self._database = {
            "usr_1": UserProfile("usr_1", "alice_dev", "pro"),
            "usr_2": UserProfile("usr_2", "bob_ops", "standard"),
            "usr_3": UserProfile("usr_3", "charlie_qa", "enterprise"),
        }

    def find_user(self, user_id: str) -> Optional[UserProfile]:
        cached = self.cache.get(user_id)
        if cached is not None:
            print(f"[CACHE HIT]  {user_id} -> {cached.username}")
            return cached

        # Simulated slow database fallback
        self.db_reads += 1
        user = self._database.get(user_id)
        if user:
            print(f"[DB QUERY]   {user_id} -> {user.username} (read #{self.db_reads})")
            self.cache.put(user_id, user)
        else:
            print(f"[DB MISS]    {user_id} not found")
        return user
`;

const mainPy = `from app.clock import SimulatedClock
from app.cache import LRUCache
from app.repository import UserRepository

def run_cache_demo() -> None:
    clock = SimulatedClock(100.0)
    # Cache holds only 2 entries to test LRU eviction behavior
    cache = LRUCache(capacity=2, default_ttl=60.0, clock=clock)
    repo = UserRepository(cache)

    print("Phase 1: Fetch user 1 and user 2 into cache")
    repo.find_user("usr_1")
    repo.find_user("usr_2")

    print("\\nPhase 2: Frequently read user 1 (should stay hot in cache)")
    repo.find_user("usr_1")
    repo.find_user("usr_1")

    print("\\nPhase 3: Fetch user 3 (exceeds capacity 2, triggers eviction)")
    repo.find_user("usr_3")

    print("\\nPhase 4: Check if popular user 1 is still in cache")
    repo.find_user("usr_1")

if __name__ == "__main__":
    run_cache_demo()
`;

const testCachePy = `import unittest
from app.clock import SimulatedClock
from app.cache import LRUCache

class TestLRUCache(unittest.TestCase):
    def test_lru_access_order_maintained(self) -> None:
        clock = SimulatedClock(10.0)
        cache = LRUCache(capacity=2, default_ttl=30.0, clock=clock)

        cache.put("k1", "val1")
        cache.put("k2", "val2")

        # Read k1 to mark it as most recently used
        val = cache.get("k1")
        self.assertEqual(val, "val1")

        # Insert k3; k2 was least recently used, so k2 must be evicted, NOT k1!
        cache.put("k3", "val3")

        self.assertEqual(cache.get("k1"), "val1")
        self.assertIsNone(cache.get("k2"))
        self.assertEqual(cache.get("k3"), "val3")

if __name__ == "__main__":
    unittest.main()
`;

export const lruCacheTtlChallenge: Challenge = {
  id: 'lru-cache-ttl',
  slug: 'lru-cache-ttl',
  title: 'LRU Cache That Evicts Popular Keys',
  category: 'Debugging',
  difficulty: 'Medium',
  estimatedMinutes: 12,
  tags: ['Caching', 'LRU', 'Data Structures'],
  entryFile: 'app/main.py',
  summary: 'An in-memory cache evicts the least recently used entries while expiring stale keys using TTL timestamps.',
  story:
    'Our service caches database queries using an LRU cache with time-to-live expiration. The analytics team reported high database load because frequently queried user profiles are repeatedly refetched. The repository logs indicate that active hot keys are being kicked out while older cold keys remain in memory. The issue causes cache misses for items that were read only seconds ago.',
  description:
    'Our service caches database queries using an LRU cache with time-to-live expiration. The analytics team reported high database load because frequently queried user profiles are repeatedly refetched. The repository logs indicate that active hot keys are being kicked out while older cold keys remain in memory. The issue causes cache misses for items that were read only seconds ago.',
  expectedInvariants: [
    'Must evict the least recently accessed item when capacity is exceeded.',
    'Must update the access order of an entry whenever it is read or written.',
    'Must expire entries whose elapsed time exceeds their time-to-live.',
  ],
  expectedBehaviour: [
    'Must evict the least recently accessed item when capacity is exceeded.',
    'Must update the access order of an entry whenever it is read or written.',
    'Must expire entries whose elapsed time exceeds their time-to-live.',
  ],
  bug: {
    file: 'app/cache.py',
    line: 27,
  },
  fix: {
    file: 'app/cache.py',
    line: 27,
    newText: '        self._items.move_to_end(key)\n        return entry.value',
  },
  decoy: {
    text: 'Check the database fallback counter in app/repository.py line 24; cache misses might be triggered by an incorrect database key check.',
    pointsTo: 'app/repository.py',
  },
  assistantHints: [
    {
      id: 'cache-hint-1',
      text: 'The UserRepository in app/repository.py might not be caching query results properly on miss.',
      pointsTo: 'app/repository.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
    {
      id: 'cache-hint-2',
      text: 'Check how OrderedDict tracks entry recency in app/cache.py when an existing entry is read via get().',
      pointsTo: 'app/cache.py',
      isDecoy: false,
      recommendedChoice: 'trust',
    },
    {
      id: 'cache-hint-3',
      text: 'The SimulatedClock in app/clock.py might be advancing timestamp values unexpectedly.',
      pointsTo: 'app/clock.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
  ],
  hints: [
    'Observe which user gets evicted in Phase 3 when usr_3 is added.',
    'Look at the difference between how put() and get() handle the item order in OrderedDict.',
    'In app/cache.py, get() returns entry.value without calling move_to_end(key), leaving frequently read keys at the front of the eviction queue.',
  ],
  explainRubric: [
    'Identifies that get() fails to call move_to_end() to refresh the entry position.',
    'Explains that OrderedDict evicts from the front (popitem(last=False)), so unrefreshed reads remain first in line to be evicted.',
    'Shows that calling move_to_end(key) on cache hits preserves hot keys under LRU eviction.',
  ],
  files: [
    { path: 'app/clock.py', language: 'python', content: clockPy },
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/cache.py', language: 'python', content: buggyCachePy },
    { path: 'app/repository.py', language: 'python', content: repoPy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_cache.py', language: 'python', content: testCachePy },
    { path: 'tests/test_cart.py', language: 'python', content: testCachePy },
  ],
  fixedFile: {
    path: 'app/cache.py',
    content: fixedCachePy,
  },
  expectedOutput: {
    buggy: `Phase 1: Fetch user 1 and user 2 into cache
[DB QUERY]   usr_1 -> alice_dev (read #1)
[DB QUERY]   usr_2 -> bob_ops (read #2)

Phase 2: Frequently read user 1 (should stay hot in cache)
[CACHE HIT]  usr_1 -> alice_dev
[CACHE HIT]  usr_1 -> alice_dev

Phase 3: Fetch user 3 (exceeds capacity 2, triggers eviction)
[DB QUERY]   usr_3 -> charlie_qa (read #3)

Phase 4: Check if popular user 1 is still in cache
[DB QUERY]   usr_1 -> alice_dev (read #4)`,
    fixed: `Phase 1: Fetch user 1 and user 2 into cache
[DB QUERY]   usr_1 -> alice_dev (read #1)
[DB QUERY]   usr_2 -> bob_ops (read #2)

Phase 2: Frequently read user 1 (should stay hot in cache)
[CACHE HIT]  usr_1 -> alice_dev
[CACHE HIT]  usr_1 -> alice_dev

Phase 3: Fetch user 3 (exceeds capacity 2, triggers eviction)
[DB QUERY]   usr_3 -> charlie_qa (read #3)

Phase 4: Check if popular user 1 is still in cache
[CACHE HIT]  usr_1 -> alice_dev`,
  },
  modelExplanation:
    'In app/cache.py, the LRUCache.get method retrieves cached values but never calls self._items.move_to_end(key). As a result, reading a cached key does not mark it as recently used. When capacity is exceeded in put(), popitem(last=False) evicts the oldest item in insertion order, incorrectly kicking out hot keys like usr_1 even though they were read moments earlier.',
};
