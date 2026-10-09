export function createSimpleCache<T>(ttlMs: number) {
  let data: T | null = null
  let expiry = 0
  let inflight: Promise<T> | null = null

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
    /**
     * Returns the cached value, or runs `load` once and shares its promise with
     * every concurrent caller (single-flight). Without this, a cache miss under
     * load fans out into one DB query per in-flight request.
     */
    getOrLoad(load: () => Promise<T>): Promise<T> {
      if (Date.now() < expiry && data !== null) return Promise.resolve(data)
      if (inflight) return inflight
      inflight = load()
        .then((value) => {
          data = value
          expiry = Date.now() + ttlMs
          return value
        })
        .finally(() => {
          inflight = null
        })
      return inflight
    },
  }
}
