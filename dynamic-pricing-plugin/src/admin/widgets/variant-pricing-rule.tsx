import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
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
import { useVariantRule, useRules, useMaterials } from "../hooks"
import {
  WeightDisplay,
  WeightTip,
  RuleAssignForm,
  useRuleAssignState,
} from "../components"

const VariantPricingRuleWidget = ({
  data: variant,
}: DetailWidgetProps<HttpTypes.AdminProductVariant>) => {
  const queryClient = useQueryClient()
  const queryKey = ["variant-pricing-rule", variant.id]

  const [editing, setEditing] = useState(false)

  // Fetch parent product weight as fallback
  const { data: productData } = useQuery<{ product: { weight: number | null } }>({
    queryKey: ["product-weight", variant.product_id],
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${variant.product_id}?fields=weight`),
    enabled: variant.weight == null && !!variant.product_id,
    staleTime: 60_000,
  })
  const productWeight = productData?.product?.weight ?? null

  const { data, isLoading } = useVariantRule(variant.id)
  const rule = data?.pricing_rule ?? null

  const { data: rulesData } = useRules(editing)
  const { data: configData } = useMaterials(editing)
  const materialOptions = configData?.config.materials ?? []

  const form = useRuleAssignState(rule?.id ?? "", rule?.material ?? "")

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
    form.setErrors({})
    setEditing(true)
  }

  const handleSave = () => {
    if (!form.validate()) return
    assign.mutate({ pricing_rule_id: form.ruleId, material: form.material })
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
          <WeightTip variantWeight={variant.weight} productWeight={productWeight} />
          <RuleAssignForm
            rules={rulesData?.pricing_rules ?? []}
            materials={materialOptions}
            ruleId={form.ruleId}
            material={form.material}
            errors={form.errors}
            isPending={assign.isPending}
            onRuleChange={(v) => { form.setRuleId(v); form.setErrors({ ...form.errors, rule: undefined! }) }}
            onMaterialChange={(v) => { form.setMaterial(v); form.setErrors({ ...form.errors, material: undefined! }) }}
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
          <WeightTip variantWeight={variant.weight} productWeight={productWeight} />
          <div className="flex items-center gap-2">
            <Text size="small" leading="compact" weight="plus">{rule.name}</Text>
            <Badge size="2xsmall" color="blue">{rule.material}</Badge>
            <WeightDisplay variantWeight={variant.weight} productWeight={productWeight} />
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
