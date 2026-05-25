import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Container, Heading, Text, Button, Skeleton, toast } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/client"

type PluginConfig = {
  materials: string[]
  fetchIntervalSeconds: number
  priceLockDurationSeconds: number
  providerName: string
}

function ConfigRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-ui-border-base last:border-0">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text size="small" leading="compact" weight="plus">
        {value}
      </Text>
    </div>
  )
}

const DynamicPricingConfigPage = () => {
  const { data, isLoading, isError } = useQuery<{ config: PluginConfig }>({
    queryKey: ["dynamic-pricing-config"],
    queryFn: () =>
      sdk.client.fetch<{ config: PluginConfig }>("/admin/dynamic-pricing/config"),
  })

  const seed = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ success: boolean; created_products: string[]; pricing_rules: string[] }>(
        "/admin/dynamic-pricing/seed",
        { method: "POST" }
      ),
    onSuccess: (result) => {
      toast.success(
        `Seeded ${result.created_products.length} products with rules: ${result.pricing_rules.join(", ")}`
      )
    },
    onError: (err: Error) => toast.error(err.message || "Seed failed"),
  })

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1">Dynamic Pricing</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
            Current plugin configuration (read-only). Edit values in{" "}
            <code>medusa-config.ts</code>.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => seed.mutate()}
            isLoading={seed.isPending}
          >
            Seed Products
          </Button>
          <Link to="/dynamic-pricing/spot-prices">
            <Button size="small" variant="secondary">
              View Spot Prices
            </Button>
          </Link>
        </div>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Plugin Configuration</Heading>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-3 border-b border-ui-border-base last:border-0">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="px-6 py-4">
            <Text size="small" leading="compact" className="text-ui-fg-error">
              Failed to load configuration.
            </Text>
          </div>
        )}

        {data?.config && (
          <>
            <ConfigRow label="Materials" value={data.config.materials.join(", ")} />
            <ConfigRow label="Fetch Interval" value={`${data.config.fetchIntervalSeconds}s`} />
            <ConfigRow label="Price Lock Duration" value={`${data.config.priceLockDurationSeconds}s`} />
            <ConfigRow label="Provider" value={data.config.providerName} />
          </>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Dynamic Pricing",
})

export default DynamicPricingConfigPage
