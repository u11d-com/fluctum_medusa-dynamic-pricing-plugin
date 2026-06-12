import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"
import { Heading, Text } from "@modules/common/components/ui"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <Heading level="h1" size="lg" className="text-ui-fg-base">Page not found</Heading>
      <Text>
        The page you tried to access does not exist.
      </Text>
      <InteractiveLink href="/">Go to frontpage</InteractiveLink>
    </div>
  )
}
