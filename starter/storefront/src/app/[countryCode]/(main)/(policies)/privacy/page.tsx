import { Metadata } from "next"
import { CONTACT_EMAIL } from "@lib/store-policies"
import PolicyTemplate, {
  PolicyParagraph,
  PolicySection,
} from "@modules/policies/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: "Privacy policy | Fluctum",
    description: "How the Fluctum store handles your personal data.",
    alternates: { canonical: `/${countryCode}/privacy` },
  }
}

export default function PrivacyPage() {
  return (
    <PolicyTemplate title="Privacy policy" updated="2026-10-16">
      <PolicySection title="What we collect">
        <PolicyParagraph>
          We store the details you enter at checkout or in your account (name,
          email, shipping and billing address, phone number) and your test
          order history. As this is a demo, please use made-up data rather
          than real personal details.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="How we use it">
        <PolicyParagraph>
          Your data is used only to process orders, provide your account and
          answer your requests. We do not sell personal data.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Cookies">
        <PolicyParagraph>
          We use strictly necessary cookies to keep your cart, region and
          sign-in session.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Your rights">
        <PolicyParagraph>
          You can request a copy of your data, its correction or deletion by
          emailing {CONTACT_EMAIL}.
        </PolicyParagraph>
      </PolicySection>
    </PolicyTemplate>
  )
}
