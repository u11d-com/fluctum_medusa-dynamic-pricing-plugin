export function createSimpleCache<T>(ttlMs: number) {
  let data: T | null = null
  let expiry = 0

  return {
    get(): T | null {
      return Date.now() < expiry ? data : null
    },
    set(value: T) {
      data = value
      expiry = Date.now() + ttlMs
    },
    invalidate() {
      data = null
      expiry = 0
    },
  }
}
