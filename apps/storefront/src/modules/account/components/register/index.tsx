"use client"

import { useActionState } from "react"
import { Button, Heading, Input, Text } from "@modules/common/components/ui"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { useTranslations } from "next-intl"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const t = useTranslations("account")
  const [message, formAction] = useActionState(signup as (state: string | null, formData: FormData) => Promise<string | null>, null as string | null)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <Heading level="h1" size="md" className="uppercase mb-6">
        {t('registerTitle')}
      </Heading>
      <Text className="text-center mb-4">
        {t('registerSubtitle')}
      </Text>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t('firstName')}
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label={t('lastName')}
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={t('email')}
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label={t('phone')}
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={t('password')}
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <Text as="span" variant="muted" className="text-center mt-6">
          {t('privacyPrefix')}{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            {t('privacyPolicy')}
          </LocalizedClientLink>{" "}
          {t('and')}{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            {t('termsOfUse')}
          </LocalizedClientLink>
          .
        </Text>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          {t('join')}
        </SubmitButton>
      </form>
      <Text as="span" variant="muted" className="text-center mt-6">
        {t('alreadyMember')}{" "}
        <Button
          variant="link"
          size="small"
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline px-0 h-auto"
        >
          {t('signIn')}
        </Button>
        .
      </Text>
    </div>
  )
}

export default Register
