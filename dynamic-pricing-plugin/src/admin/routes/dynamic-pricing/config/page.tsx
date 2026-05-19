import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import { Container, Heading, Text } from "@medusajs/ui"
import { sdk } from "../../../lib/client"

type PluginConfig = {
  materials: string[]
  fetchIntervalSeconds: number
  priceLockDurationSeconds: number
  providerName: string
}

function ConfigRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
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

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div>
        <Heading level="h1">Dynamic Pricing</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
          Current plugin configuration (read-only). Edit values in{" "}
          <code>medusa-config.ts</code>.
        </Text>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Plugin Configuration</Heading>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ui-border-strong border-t-transparent" />
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
            <ConfigRow
              label="Materials"
              value={data.config.materials.join(", ")}
            />
            <ConfigRow
              label="Fetch Interval"
              value={`${data.config.fetchIntervalSeconds}s`}
            />
            <ConfigRow
              label="Price Lock Duration"
              value={`${data.config.priceLockDurationSeconds}s`}
            />
            <ConfigRow
              label="Provider"
              value={data.config.providerName}
            />
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
