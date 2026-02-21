# Bolt Journal
## Critical Performance Learnings Only

## 2025-05-15 - Stream Reliability
**Learning:** Audio streams in web browsers often fail or stall due to transient network issues. Relying solely on the `error` event is insufficient as `stalled` can also indicate a break in playback.
**Action:** Implemented a retry mechanism that listens to both `error` and `stalled` events, resetting on `playing`. This significantly improves "perceived performance" and user satisfaction in mobile/car environments.
