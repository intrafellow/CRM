import time
from typing import Dict, Tuple


class InMemoryRateLimiter:
  """Простой in-memory rate limiter (для одного инстанса приложения).
  Не для распределённой прод-среды, но хватает как MVP защиты.
  """

  def __init__(self):
    # key -> (window_start_ts, count)
    self._buckets: Dict[str, Tuple[float, int]] = {}

  def allow(self, key: str, limit: int, window_seconds: int) -> bool:
    now = time.time()
    bucket = self._buckets.get(key)
    if not bucket:
      self._buckets[key] = (now, 1)
      return True
    start, cnt = bucket
    if now - start > window_seconds:
      # новая временная оконная корзина
      self._buckets[key] = (now, 1)
      return True
    if cnt + 1 > limit:
      return False
    self._buckets[key] = (start, cnt + 1)
    return True


limiter = InMemoryRateLimiter()








