import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Text,
  Badge,
  Table,
  Button,
  Skeleton,
} from "@medusajs/ui";
import { sdk } from "../../../lib/client";

type SpotPrice = {
  id: string;
  material: string;
  price: number;
  ask: number;
  bid: number;
  created_at: string;
};

type SsePricePayload = {
  material: string;
  price: number;
  ask: number;
  bid: number;
  timestamp: string;
};

type ListResponse = {
  spot_prices: SpotPrice[];
  count: number;
  limit: number;
  offset: number;
};

// ── Current prices card (SSE) ─────────────────────────────────────────────────

function LatestPricesCard() {
  const [prices, setPrices] = useState<SsePricePayload[] | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let abortFn: (() => void) | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const { stream, abort } = await sdk.client.fetchStream(
          "/admin/dynamic-pricing/sse"
        );
        if (cancelled) {
          abort();
          return;
        }
        abortFn = abort;
        setConnected(true);

        for await (const event of stream) {
          if (event.event === "spot-prices" && event.data) {
            try {
              setPrices(JSON.parse(event.data) as SsePricePayload[]);
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        setConnected(false);
      }
    }

    connect();

    return () => {
      cancelled = true;
      abortFn?.();
    };
  }, []);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Current Prices</Heading>
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle mt-1"
          >
            {connected ? "Live via SSE" : "Connecting…"}
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        {prices === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : prices.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No spot prices recorded yet.
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            {prices.map((sp) => (
              <div
                key={sp.material}
                className="flex items-center justify-between rounded-md border border-ui-border-base px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge size="2xsmall" color="blue">
                    {sp.material}
                  </Badge>
                  <Text size="small" leading="compact" weight="plus">
                    ${Number(sp.price).toFixed(4)}
                  </Text>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      Ask
                    </Text>
                    <Text size="small" leading="compact" weight="plus">
                      ${Number(sp.ask).toFixed(4)}
                    </Text>
                  </div>
                  <div className="flex items-center gap-1">
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      Bid
                    </Text>
                    <Text size="small" leading="compact" weight="plus">
                      ${Number(sp.bid).toFixed(4)}
                    </Text>
                  </div>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {new Date(sp.timestamp).toLocaleTimeString()}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

// ── Historical prices table ───────────────────────────────────────────────────

const PAGE_SIZE = 20;

function HistoricalPricesTable() {
  const [page, setPage] = useState(0);
  const [materialFilter, setMaterialFilter] = useState("");

  const offset = page * PAGE_SIZE;

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["dynamic-pricing-history", page, materialFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (materialFilter) params.set("material", materialFilter);
      return sdk.client.fetch<ListResponse>(
        `/admin/dynamic-pricing/spot-prices?${params}`,
      );
    },
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Historical Prices</Heading>
        <div className="flex items-center gap-2">
          {["", "XAU", "XAG"].map((m) => (
            <Button
              key={m}
              size="small"
              variant={materialFilter === m ? "primary" : "secondary"}
              onClick={() => {
                setMaterialFilter(m);
                setPage(0);
              }}
            >
              {m || "All"}
            </Button>
          ))}
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Material</Table.HeaderCell>
            <Table.HeaderCell>Price</Table.HeaderCell>
            <Table.HeaderCell>Ask</Table.HeaderCell>
            <Table.HeaderCell>Bid</Table.HeaderCell>
            <Table.HeaderCell>Timestamp</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Table.Row key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Table.Cell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          ) : !data?.spot_prices?.length ? (
            <Table.Row>
              <Table.Cell>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle py-4 text-center"
                >
                  No records found.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            data.spot_prices.map((sp) => (
              <Table.Row key={sp.id}>
                <Table.Cell>
                  <Badge size="2xsmall" color="blue">
                    {sp.material}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" leading="compact" weight="plus">
                    ${Number(sp.price).toFixed(4)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" leading="compact">
                    ${Number(sp.ask).toFixed(4)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" leading="compact">
                    ${Number(sp.bid).toFixed(4)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {new Date(sp.created_at).toLocaleString()}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {data?.count} records · page {page + 1} of {totalPages}
          </Text>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SpotPricesPage = () => {
  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div>
        <Heading level="h1">Spot Prices</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
          Live and historical precious metal spot prices.
        </Text>
      </div>
      <LatestPricesCard />
      <HistoricalPricesTable />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Spot Prices",
});

export default SpotPricesPage;
