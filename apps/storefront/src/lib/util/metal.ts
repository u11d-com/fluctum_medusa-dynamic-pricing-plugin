const MATERIAL_NAMES: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
}

export function materialName(material: string): string {
  return MATERIAL_NAMES[material] ?? material
}
