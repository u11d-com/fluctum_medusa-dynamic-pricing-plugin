export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

export const absoluteUrl = (path: string) => {
  return new URL(path, getBaseURL()).toString()
}
