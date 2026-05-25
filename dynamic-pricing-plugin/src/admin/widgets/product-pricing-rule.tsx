import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Skeleton,
  Drawer,
  Table,
  toast,
  Prompt,
} from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { sdk } from "../lib/client"
import { useRules, useMaterials, useVariantRule, useLiveSpotPrices } from "../hooks"
import {
  RuleAssignForm,
  useRuleAssignState,
  computePrice,
} from "../components"
import type { VariantAssignment, SpotPriceMap } from "../types"

// ── Single-variant inline card ────────────────────────────────────────────────

function SingleVariantCard({
  variant,
  queryKey,
  spotPrices,
}: {
  variant: HttpTypes.AdminProductVariant
  queryKey: string[]
  spotPrices: SpotPriceMap
}) {
  const queryClient = useQueryClient()
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
    onError: (err: Error) => toast.error(err.message || "Failed to assign"),
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
    onError: (err: Error) => toast.error(err.message || "Failed to remove"),
  })

  const handleSave = () => {
    if (!form.validate()) return
    assign.mutate({
      pricing_rule_id: form.ruleId,
      material: form.material,
      weight_oz: form.weightOzValue(),
    })
  }

  if (isLoading) {
    return (
      <div className="px-6 py-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    )
  }

  if (!editing && rule) {
    const sp = spotPrices[rule.material]
    const weight = rule.weight_oz
    const finalPrice =
      sp != null && weight != null
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
      <div className="px-6 py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
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
            <div className="flex items-center gap-6">
              {([
                ["Spread ×", rule.spread_factor],
                ["Spread +", rule.spread_fixed],
                ["Premium %", rule.premium_percentage],
                ["Premium +", rule.premium_fixed],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label} className="flex items-center gap-1">
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">{label}</Text>
                  <Text size="small" leading="compact">{Number(value).toFixed(4)}</Text>
                </div>
              ))}
            </div>
            {sp ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">Product price</Text>
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
            ) : (
              <Skeleton className="h-4 w-48" />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="small"
              variant="transparent"
              onClick={() => {
                form.setRuleId(rule.id)
                form.setMaterial(rule.material)
                form.setWeightOz(rule.weight_oz != null ? String(rule.weight_oz) : "")
                form.setErrors({})
                setEditing(true)
              }}
            >
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
      </div>
    )
  }

  if (!editing && !rule) {
    return (
      <div className="px-6 py-4 flex items-center justify-between">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">No pricing rule assigned.</Text>
        <Button size="small" variant="secondary" onClick={() => setEditing(true)}>
          <PencilSquare />
          Assign Rule
        </Button>
      </div>
    )
  }

  // Edit / Assign form
  return (
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
  )
}

// ── Multi-variant: bulk assign drawer ─────────────────────────────────────────

function BulkAssignDrawer({
  variants,
  productId,
  onAssigned,
}: {
  variants: HttpTypes.AdminProductVariant[]
  productId: string
  onAssigned: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useRuleAssignState()

  const { data: rulesData } = useRules(open)
  const { data: configData } = useMaterials(open)
  const materialOptions = configData?.config.materials ?? []

  const assign = useMutation({
    mutationFn: (body: object) =>
      sdk.client.fetch(
        `/admin/dynamic-pricing/products/${productId}/pricing-rule`,
        { method: "POST", body }
      ),
    onSuccess: () => {
      toast.success("Pricing rule assigned to all variants")
      setOpen(false)
      form.reset()
      onAssigned()
    },
    onError: (err: Error) => toast.error(err.message || "Failed to assign rule"),
  })

  const handleSubmit = () => {
    if (!form.validate()) return
    assign.mutate({
      pricing_rule_id: form.ruleId,
      material: form.material,
      weight_oz: form.weightOzValue(),
    })
  }

  return (
    <>
      <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
        <PencilSquare />
        Assign Rule to All
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Assign Pricing Rule to All Variants</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-6 overflow-auto p-6">
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
              onSave={handleSubmit}
              onCancel={() => { setOpen(false); form.reset() }}
            />
          </Drawer.Body>

          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={assign.isPending}>Cancel</Button>
              </Drawer.Close>
              <Button size="small" onClick={handleSubmit} isLoading={assign.isPending}>
                Assign to all variants
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

// ── Widget ────────────────────────────────────────────────────────────────────

const ProductPricingRuleWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const queryKey = ["product-variant-pricing-rules", product.id]
  const navigate = useNavigate()

  const spotPrices = useLiveSpotPrices()

  const variantsQueryKey = ["product-variants-for-pricing", product.id]
  const { data: variantsData, isLoading: variantsLoading } = useQuery<{
    variants: HttpTypes.AdminProductVariant[]
  }>({
    queryKey: variantsQueryKey,
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${product.id}/variants?fields=id,title,sku&limit=500`),
  })

  const variants = variantsData?.variants ?? []
  const isSingleVariant = variants.length === 1

  const multiQuery = useQuery<Record<string, VariantAssignment>>({
    queryKey,
    queryFn: async () => {
      const results: Record<string, VariantAssignment> = {}
      await Promise.all(
        variants.map(async (v) => {
          const d = await sdk.client.fetch<VariantAssignment>(
            `/admin/dynamic-pricing/variants/${v.id}/pricing-rule`
          )
          results[v.id] = d
        })
      )
      return results
    },
    enabled: !isSingleVariant && variants.length > 0,
  })

  const assignments = multiQuery.data ?? {}
  const isLoading = variantsLoading || multiQuery.isLoading
  const assignedCount = Object.values(assignments).filter((a) => a.pricing_rule !== null).length

  if (variantsLoading) {
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

  // ── Single variant ──
  if (isSingleVariant) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Dynamic Pricing</Heading>
        </div>
        <SingleVariantCard
          variant={variants[0]}
          queryKey={["variant-pricing-rule", variants[0].id]}
          spotPrices={spotPrices}
        />
      </Container>
    )
  }

  // ── Multi-variant ──
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Dynamic Pricing</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
            {isLoading ? "Loading…" : `${assignedCount} of ${variants.length} variants assigned`}
          </Text>
        </div>
        <BulkAssignDrawer
          variants={variants}
          productId={product.id}
          onAssigned={() => {
            queryClient.invalidateQueries({ queryKey })
            queryClient.invalidateQueries({ queryKey: variantsQueryKey })
          }}
        />
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Variant</Table.HeaderCell>
            <Table.HeaderCell>Rule</Table.HeaderCell>
            <Table.HeaderCell>Material</Table.HeaderCell>
            <Table.HeaderCell>Weight (oz)</Table.HeaderCell>
            <Table.HeaderCell>Product Price</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {variants.map((v) => {
            const rule = assignments[v.id]?.pricing_rule ?? null
            const weight = rule?.weight_oz ?? null
            const sp = rule ? spotPrices[rule.material] : undefined
            const finalPrice =
              rule && sp && weight != null
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
              <Table.Row
                key={v.id}
                className="cursor-pointer hover:bg-ui-bg-base-hover"
                onClick={() => navigate(`/products/${product.id}/variants/${v.id}`)}
              >
                <Table.Cell>
                  <Text size="small" leading="compact" weight="plus">{v.title ?? v.sku ?? v.id}</Text>
                </Table.Cell>
                <Table.Cell>
                  {isLoading ? <Skeleton className="h-4 w-24" />
                    : rule ? <Text size="small" leading="compact">{rule.name}</Text>
                    : <Text size="small" leading="compact" className="text-ui-fg-subtle">—</Text>}
                </Table.Cell>
                <Table.Cell>
                  {isLoading ? <Skeleton className="h-4 w-12" />
                    : rule?.material ? <Badge size="2xsmall" color="blue">{rule.material}</Badge>
                    : <Text size="small" leading="compact" className="text-ui-fg-subtle">—</Text>}
                </Table.Cell>
                <Table.Cell>
                  {weight != null
                    ? <Text size="small" leading="compact">{weight} oz</Text>
                    : rule
                      ? <Text size="small" leading="compact" className="text-ui-fg-error">not set</Text>
                      : <Text size="small" leading="compact" className="text-ui-fg-subtle">—</Text>}
                </Table.Cell>
                <Table.Cell>
                  {!rule ? (
                    <Text size="small" leading="compact" className="text-ui-fg-subtle">—</Text>
                  ) : finalPrice != null ? (
                    <Text size="small" leading="compact" weight="plus">
                      ${finalPrice.toFixed(2)}
                    </Text>
                  ) : sp ? (
                    <Text size="small" leading="compact" className="text-ui-fg-error">
                      weight not set
                    </Text>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductPricingRuleWidget
