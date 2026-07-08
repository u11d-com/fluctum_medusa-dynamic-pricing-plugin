import InteractiveLink from "@modules/common/components/interactive-link"
import { Heading, Text } from "@modules/common/components/ui"
import { Metadata } from "next"
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default async function NotFound() {
  const t = await getTranslations('common')
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <Heading level="h1" size="lg" className="text-ui-fg-base">{t('pageNotFound')}</Heading>
      <Text>
        {t('pageNotFoundBody')}
      </Text>
      <InteractiveLink href="/">{t('goToFrontpage')}</InteractiveLink>
    </div>
  )
}
