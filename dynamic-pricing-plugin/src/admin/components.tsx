import { useState } from "react"
import { Text, Button, Label, Select, Input } from "@medusajs/ui"
import type { PricingRule } from "./types"

// ── Price formula (mirrored from src/utils/price-formula.ts for admin bundle) ──
//
// final = weight × ask × spreadFactor × (1 + premiumPercentage/100)
//         + spreadFixed + premiumFixed
//
// Uses ask price per business requirement: the price a buyer pays.

export function computePrice({
  weight,
  ask,
  spreadFactor,
  spreadFixed,
  premiumPercentage,
  premiumFixed,
}: {
  weight: number
  ask: number
  spreadFactor: number
  spreadFixed: number
  premiumPercentage: number
  premiumFixed: number
}): number {
  const base = weight * ask * spreadFactor
  const withPremiumPct = base * (1 + premiumPercentage / 100)
  return withPremiumPct + spreadFixed + premiumFixed
}

// ── Weight helpers ────────────────────────────────────────────────────────────

// ── RuleAssignForm ────────────────────────────────────────────────────────────

export type RuleAssignFormProps = {
  rules: PricingRule[]
  materials: string[]
  ruleId: string
  material: string
  weightOz: string
  errors: Record<string, string>
  isPending: boolean
  onRuleChange: (v: string) => void
  onMaterialChange: (v: string) => void
  onWeightOzChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

export function RuleAssignForm({
  rules,
  materials,
  ruleId,
  material,
  weightOz,
  errors,
  isPending,
  onRuleChange,
  onMaterialChange,
  onWeightOzChange,
  onSave,
  onCancel,
}: RuleAssignFormProps) {
  return (
    <>
      <div className="flex flex-col gap-y-2">
        <Label>Pricing Rule</Label>
        <Select value={ruleId} onValueChange={onRuleChange}>
          <Select.Trigger>
            <Select.Value placeholder="Select a rule…" />
          </Select.Trigger>
          <Select.Content>
            {rules.map((r) => (
              <Select.Item key={r.id} value={r.id}>
                {r.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        {errors.rule && (
          <Text size="small" leading="compact" className="text-ui-fg-error">
            {errors.rule}
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Material</Label>
        <Select value={material} onValueChange={onMaterialChange}>
          <Select.Trigger>
            <Select.Value placeholder="Select material…" />
          </Select.Trigger>
          <Select.Content>
            {materials.map((m) => (
              <Select.Item key={m} value={m}>
                {m}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        {errors.material && (
          <Text size="small" leading="compact" className="text-ui-fg-error">
            {errors.material}
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Weight (oz)</Label>
        <Input
          type="number"
          min="0"
          step="any"
          value={weightOz}
          onChange={(e) => onWeightOzChange(e.target.value)}
        />
        {errors.weightOz && (
          <Text size="small" leading="compact" className="text-ui-fg-error">
            {errors.weightOz}
          </Text>
        )}
      </div>

      <div className="flex items-center gap-x-2">
        <Button size="small" onClick={onSave} isLoading={isPending}>
          Save
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </>
  )
}

// ── useRuleAssignState ────────────────────────────────────────────────────────

export function useRuleAssignState(initialRuleId = "", initialMaterial = "", initialWeightOz = "") {
  const [ruleId, setRuleId] = useState(initialRuleId)
  const [material, setMaterial] = useState(initialMaterial)
  const [weightOz, setWeightOz] = useState(initialWeightOz)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const next: Record<string, string> = {}
    if (!ruleId) next.rule = "Select a pricing rule"
    if (!material) next.material = "Select a material"
    if (weightOz !== "" && (isNaN(Number(weightOz)) || Number(weightOz) <= 0)) {
      next.weightOz = "Weight must be a positive number"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function reset() {
    setRuleId(initialRuleId)
    setMaterial(initialMaterial)
    setWeightOz(initialWeightOz)
    setErrors({})
  }

  /** Returns weight_oz as number | null (null if field left blank) */
  function weightOzValue(): number | null {
    const n = Number(weightOz)
    return weightOz !== "" && !isNaN(n) && n > 0 ? n : null
  }

  return {
    ruleId, setRuleId,
    material, setMaterial,
    weightOz, setWeightOz,
    errors, setErrors,
    validate,
    reset,
    weightOzValue,
  }
}
