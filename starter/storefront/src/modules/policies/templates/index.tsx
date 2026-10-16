import { ReactNode } from "react"
import { BUILDER, DEMO_NOTICE, FRAMEWORK_URL } from "@lib/store-policies"
import { Heading, StatusNotice, Text } from "@modules/common/components/ui"

export function PolicySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-y-3">
      <Heading level="h2" size="md">
        {title}
      </Heading>
      {children}
    </section>
  )
}

export function PolicyParagraph({ children }: { children: ReactNode }) {
  return <Text className="text-ui-fg-subtle leading-relaxed">{children}</Text>
}

export default function PolicyTemplate({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <article
      className="content-container max-w-3xl py-12 flex flex-col gap-y-8"
      data-testid="policy-page"
    >
      <header className="flex flex-col gap-y-2">
        <Heading level="h1" size="lg">
          {title}
        </Heading>
        <Text variant="muted">Last updated: {updated}</Text>
      </header>
      <StatusNotice
        tone="warning"
        role="note"
        aria-label="Demo store notice"
        data-testid="demo-notice"
      >
        <Text className="text-sm text-inherit leading-relaxed">
          <strong>Demo store.</strong> {DEMO_NOTICE} This page shows how a
          store built with Fluctum can be configured. Learn more at{" "}
          <a href={FRAMEWORK_URL} className="underline">
            fluctum.io
          </a>{" "}
          or meet the team at{" "}
          <a href={BUILDER.url} className="underline">
            u11d.com
          </a>
          .
        </Text>
      </StatusNotice>
      {children}
    </article>
  )
}
