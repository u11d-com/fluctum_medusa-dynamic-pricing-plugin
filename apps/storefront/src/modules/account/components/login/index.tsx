import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { Button, Heading, Input, Text } from "@modules/common/components/ui"
import { useActionState } from "react"
import { useTranslations } from "next-intl"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const t = useTranslations("account")
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <Heading level="h1" size="md" className="uppercase mb-6">{t('welcomeBack')}</Heading>
      <Text className="text-center mb-8">
        {t('loginSubtitle')}
      </Text>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t('email')}
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={t('password')}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          {t('signIn')}
        </SubmitButton>
      </form>
      <Text as="span" variant="muted" className="text-center mt-6">
        {t('newMember')}{" "}
        <Button
          variant="link"
          size="small"
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline px-0 h-auto"
          data-testid="register-button"
        >
          {t('joinUs')}
        </Button>
        .
      </Text>
    </div>
  )
}

export default Login
