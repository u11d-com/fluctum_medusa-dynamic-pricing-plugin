import { useState } from "react"
import { Text, Button, Label, Select, InlineTip } from "@medusajs/ui"
import type { PricingRule } from "./types"

// ── Weight helpers ────────────────────────────────────────────────────────────

export function effectiveWeight(
  variantWeight: number | null | undefined,
  productWeight: number | null | undefined
): number | null {
  return variantWeight ?? productWeight ?? null
}

export function WeightDisplay({
  variantWeight,
  productWeight,
}: {
  variantWeight: number | null | undefined
  productWeight: number | null | undefined
}) {
  const w = effectiveWeight(variantWeight, productWeight)
  if (w == null) {
    return (
      <Text size="small" leading="compact" className="text-ui-fg-error">
        weight not set
      </Text>
    )
  }
  return (
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {w} troy oz{variantWeight == null ? " (product default)" : ""}
    </Text>
  )
}

export function WeightTip({
  variantWeight,
  productWeight,
}: {
  variantWeight: number | null | undefined
  productWeight: number | null | undefined
}) {
  const effective = effectiveWeight(variantWeight, productWeight)
  if (effective == null) {
    return (
      <InlineTip variant="warning" label="Weight not set">
        No weight found on this variant or its product. Set it in the Shipping section — it must be in troy ounces.
      </InlineTip>
    )
  }
  if (variantWeight == null) {
    return (
      <InlineTip variant="info" label="Using product weight">
        This variant has no weight set — falling back to the product weight ({productWeight} troy oz). Set a variant-level weight in the Shipping section to override it.
      </InlineTip>
    )
  }
  return (
    <InlineTip variant="info" label="Weight unit">
      Variant weight is read from the Shipping section and must be in troy ounces.
    </InlineTip>
  )
}

// ── RuleAssignForm ────────────────────────────────────────────────────────────

export type RuleAssignFormProps = {
  rules: PricingRule[]
  materials: string[]
  ruleId: string
  material: string
  errors: Record<string, string>
  isPending: boolean
  onRuleChange: (v: string) => void
  onMaterialChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

export function RuleAssignForm({
  rules,
  materials,
  ruleId,
  material,
  errors,
  isPending,
  onRuleChange,
  onMaterialChange,
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

export function useRuleAssignState(initialRuleId = "", initialMaterial = "") {
  const [ruleId, setRuleId] = useState(initialRuleId)
  const [material, setMaterial] = useState(initialMaterial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const next: Record<string, string> = {}
    if (!ruleId) next.rule = "Select a pricing rule"
    if (!material) next.material = "Select a material"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function reset() {
    setRuleId(initialRuleId)
    setMaterial(initialMaterial)
    setErrors({})
  }

  return {
    ruleId, setRuleId,
    material, setMaterial,
    errors, setErrors,
    validate,
    reset,
  }
}
