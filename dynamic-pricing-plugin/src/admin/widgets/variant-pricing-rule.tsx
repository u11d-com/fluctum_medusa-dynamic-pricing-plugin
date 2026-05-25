import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Skeleton,
  toast,
  Prompt,
} from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { sdk } from "../lib/client"
import { useVariantRule, useRules, useMaterials, useLiveSpotPrices } from "../hooks"
import {
  RuleAssignForm,
  useRuleAssignState,
  computePrice,
} from "../components"
import type { PricingRuleWithMaterial, SpotPricePayload } from "../types"

// ── Live price display ────────────────────────────────────────────────────────

function LivePriceDisplay({ rule }: { rule: PricingRuleWithMaterial }) {
  const prices = useLiveSpotPrices()
  const sp: SpotPricePayload | undefined = prices[rule.material]
  const weight = rule.weight_oz

  if (!sp) {
    return (
      <div className="flex items-center gap-2">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Live price
        </Text>
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  const finalPrice =
    weight != null
      ? computePrice({
          weight,
          ask: sp.ask,
          spreadFactor: Number(rule.spread_factor),
          spreadFixed: Number(rule.spread_fixed),
          premiumPercentage: Number(rule.premium_percentage),
          premiumFixed: Number(rule.premium_fixed),
        })
      : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Product price
        </Text>
        {finalPrice != null ? (
          <Text size="small" leading="compact" weight="plus">
            ${finalPrice.toFixed(2)}
          </Text>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-error">
            weight not set — cannot compute
          </Text>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">Spot</Text>
        <Text size="small" leading="compact">${sp.price.toFixed(4)}</Text>
        <div className="flex items-center gap-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">Ask</Text>
          <Text size="small" leading="compact">${sp.ask.toFixed(4)}</Text>
        </div>
        <div className="flex items-center gap-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">Bid</Text>
          <Text size="small" leading="compact">${sp.bid.toFixed(4)}</Text>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {new Date(sp.timestamp).toLocaleTimeString()}
        </Text>
      </div>
    </div>
  )
}

// ── Widget ────────────────────────────────────────────────────────────────────

const VariantPricingRuleWidget = ({
  data: variant,
}: DetailWidgetProps<HttpTypes.AdminProductVariant>) => {
  const queryClient = useQueryClient()
  const queryKey = ["variant-pricing-rule", variant.id]

  const [editing, setEditing] = useState(false)

  const { data, isLoading } = useVariantRule(variant.id)
  const rule = data?.pricing_rule ?? null

  const { data: rulesData } = useRules(editing)
  const { data: configData } = useMaterials(editing)
  const materialOptions = configData?.config.materials ?? []

  const form = useRuleAssignState(
    rule?.id ?? "",
    rule?.material ?? "",
    rule?.weight_oz != null ? String(rule.weight_oz) : ""
  )

  const assign = useMutation({
    mutationFn: (body: object) =>
      sdk.client.fetch(
        `/admin/dynamic-pricing/variants/${variant.id}/pricing-rule`,
        { method: "POST", body }
      ),
    onSuccess: () => {
      toast.success("Pricing rule assigned")
      setEditing(false)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: Error) => toast.error(err.message || "Failed to assign rule"),
  })

  const unassign = useMutation({
    mutationFn: () =>
      sdk.client.fetch(
        `/admin/dynamic-pricing/variants/${variant.id}/pricing-rule`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      toast.success("Pricing rule removed")
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: Error) => toast.error(err.message || "Failed to remove rule"),
  })

  const openEdit = () => {
    form.setRuleId(rule?.id ?? "")
    form.setMaterial(rule?.material ?? "")
    form.setWeightOz(rule?.weight_oz != null ? String(rule.weight_oz) : "")
    form.setErrors({})
    setEditing(true)
  }

  const handleSave = () => {
    if (!form.validate()) return
    assign.mutate({
      pricing_rule_id: form.ruleId,
      material: form.material,
      weight_oz: form.weightOzValue(),
    })
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4"><Heading level="h2">Dynamic Pricing</Heading></div>
        <div className="px-6 py-4 flex flex-col gap-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </Container>
    )
  }

  // ── Edit / Assign form ──
  if (editing) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4"><Heading level="h2">Dynamic Pricing</Heading></div>
        <div className="px-6 py-4 flex flex-col gap-4">
          <RuleAssignForm
            rules={rulesData?.pricing_rules ?? []}
            materials={materialOptions}
            ruleId={form.ruleId}
            material={form.material}
            weightOz={form.weightOz}
            errors={form.errors}
            isPending={assign.isPending}
            onRuleChange={(v) => { form.setRuleId(v); form.setErrors({ ...form.errors, rule: undefined! }) }}
            onMaterialChange={(v) => { form.setMaterial(v); form.setErrors({ ...form.errors, material: undefined! }) }}
            onWeightOzChange={(v) => { form.setWeightOz(v); form.setErrors({ ...form.errors, weightOz: undefined! }) }}
            onSave={handleSave}
            onCancel={() => { setEditing(false); form.setErrors({}) }}
          />
        </div>
      </Container>
    )
  }

  // ── Assigned ──
  if (rule) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Dynamic Pricing</Heading>
          <div className="flex items-center gap-1">
            <Button size="small" variant="transparent" onClick={openEdit}>
              <PencilSquare className="text-ui-fg-subtle" />
            </Button>
            <Prompt>
              <Prompt.Trigger asChild>
                <Button size="small" variant="transparent" disabled={unassign.isPending}>
                  <Trash className="text-ui-fg-subtle" />
                </Button>
              </Prompt.Trigger>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Remove pricing rule?</Prompt.Title>
                  <Prompt.Description>This variant will no longer have dynamic pricing applied.</Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Cancel</Prompt.Cancel>
                  <Prompt.Action onClick={() => unassign.mutate()}>Remove</Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
          </div>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Text size="small" leading="compact" weight="plus">{rule.name}</Text>
            <Badge size="2xsmall" color="blue">{rule.material}</Badge>
            {rule.weight_oz != null ? (
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {rule.weight_oz} oz
              </Text>
            ) : (
              <Text size="small" leading="compact" className="text-ui-fg-error">
                weight not set
              </Text>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {([
              ["Spread Factor", rule.spread_factor],
              ["Spread Fixed", rule.spread_fixed],
              ["Premium %", rule.premium_percentage],
              ["Premium Fixed", rule.premium_fixed],
            ] as [string, number][]).map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <Text size="small" leading="compact" className="text-ui-fg-subtle">{label}</Text>
                <Text size="small" leading="compact">{Number(value).toFixed(4)}</Text>
              </div>
            ))}
          </div>
          <LivePriceDisplay rule={rule} />
        </div>
      </Container>
    )
  }

  // ── Not assigned ──
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Dynamic Pricing</Heading>
        <Button size="small" variant="secondary" onClick={openEdit}>
          <PencilSquare />
          Assign Rule
        </Button>
      </div>
      <div className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          No pricing rule assigned to this variant.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default VariantPricingRuleWidget
