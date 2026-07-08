export function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export function getOptionalFormString(
  formData: FormData,
  key: string
): string | undefined {
  const value = getFormString(formData, key)
  return value ? value : undefined
}

export function getCheckboxValue(formData: FormData, key: string): boolean {
  const value = formData.get(key)
  return value === "on" || value === "true"
}
