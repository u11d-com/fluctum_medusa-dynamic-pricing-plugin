import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div className="mt-6">
      <Heading size="sm" className="text-base-semi">Need help?</Heading>
      <div className="my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <Text><LocalizedClientLink href="/contact">Contact</LocalizedClientLink></Text>
          </li>
          <li>
            <Text>
              <LocalizedClientLink href="/contact">
                Returns & Exchanges
              </LocalizedClientLink>
            </Text>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
