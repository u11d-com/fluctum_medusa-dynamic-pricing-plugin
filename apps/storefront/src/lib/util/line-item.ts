type WithCreatedAt = {
  created_at?: string | Date | null
}

function normalizeCreatedAt(value: string | Date | null | undefined): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value ?? ""
}

export function sortByCreatedAtDesc<T extends WithCreatedAt>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return normalizeCreatedAt(a.created_at) > normalizeCreatedAt(b.created_at) ? -1 : 1
  })
}
