"use client"

import { useTranslations } from "next-intl"
import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  const t = useTranslations('account')
  return (
    <div className="bg-ui-bg-base flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          {t('alreadyMember')}
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          {t('loginSubtitle')}
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            {t('signIn')}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
