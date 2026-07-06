# ADR 0002 — SSE for Real-Time Price Delivery

**Date:** 2025  
**Status:** Accepted

## Context

Precious-metal spot prices update every few seconds. The storefront and admin panel need to display prices that are as current as possible. Several real-time delivery mechanisms exist: polling, WebSockets, and Server-Sent Events (SSE).

## Decision

We use **Server-Sent Events (SSE)** to push spot price updates from the backend to both the storefront and admin panel.

- The Medusa backend exposes two SSE endpoints: `/store/dynamic-pricing/sse` and `/admin/dynamic-pricing/sse`
- On connect, each endpoint sends the current spot prices immediately, then broadcasts every time `fetchAndSaveSpotPricesWorkflow` completes
- The storefront proxies the SSE stream through a Next.js route handler (`/api/sse/spot-prices`) to keep the backend URL server-side and avoid CORS issues
- The `SseManager` is a module-scoped singleton managing a `Map<string, Response>` of active clients; it sends keep-alive comments every 30 seconds

## Consequences

**Positive:**
- Single persistent TCP connection per client — much more efficient than polling for a high-update-frequency stream
- Native browser support — no library needed on the client
- Simpler than WebSockets for a one-way server-push use case
- Automatic reconnection handled by the browser's `EventSource` API

**Negative:**
- HTTP/1.1 browsers cap concurrent connections per origin to ~6; the SSE connection counts against this. Mitigated by HTTP/2 multiplexing in production.
- Server process must keep the response stream open for each connected client; under very high concurrent user counts, this adds memory pressure. Acceptable for a precious-metals store (low concurrency).
- SSE is unidirectional — the client cannot send data. For this use case (price broadcast), that is the correct model.

## Alternatives Considered

**Polling (setInterval + fetch)** — Rejected. Creates N×M request load (N clients × M intervals). Introduces latency up to one polling interval. Burns unnecessary resources for data that changes server-side, not client-side.

**WebSockets** — Rejected. Bidirectional channel adds complexity (connection upgrade, ping/pong heartbeats, separate ws server) for a use case that only needs server → client communication.

**Long-polling** — Rejected. More complex than SSE, effectively re-inventing a subset of SSE with worse ergonomics.
