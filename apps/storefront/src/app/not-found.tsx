import { ArrowUpRightMini } from "@medusajs/icons"
import { Heading, Text } from "@modules/common/components/ui"
import { Metadata } from "next"
import Link from "next/link"
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
      <Link className="flex gap-x-1 items-center group" href="/">
        <Text className="text-ui-fg-interactive">{t('goToFrontpage')}</Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
