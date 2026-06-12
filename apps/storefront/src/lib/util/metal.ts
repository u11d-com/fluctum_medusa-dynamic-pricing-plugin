const MATERIAL_NAMES: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
}

/** CSS Tailwind bg class for the live dot indicator */
export const MATERIAL_DOT: Record<string, string> = {
  XAU: "bg-yellow-400",
  XAG: "bg-slate-400",
  XPT: "bg-blue-300",
  XPD: "bg-purple-400",
}

export function materialName(material: string): string {
  return MATERIAL_NAMES[material] ?? material
}

export function materialDotClass(material: string): string {
  return MATERIAL_DOT[material] ?? "bg-gray-400"
}
