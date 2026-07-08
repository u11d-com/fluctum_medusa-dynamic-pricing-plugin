import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"
import { getTranslations } from "next-intl/server"

const Help = async () => {
  const t = await getTranslations('order')
  return (
    <div className="mt-6">
      <Heading size="sm" className="text-base-semi">{t('help')}</Heading>
      <div className="my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <Text><LocalizedClientLink href="/contact">{t('contact')}</LocalizedClientLink></Text>
          </li>
          <li>
            <Text>
              <LocalizedClientLink href="/contact">
                {t('returns')}
              </LocalizedClientLink>
            </Text>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
