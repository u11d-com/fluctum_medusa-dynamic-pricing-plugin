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
    title: "Terms of service | Fluctum",
    description: "Terms that apply to purchases in the Fluctum store.",
    alternates: { canonical: `/${countryCode}/terms` },
  }
}

export default function TermsPage() {
  return (
    <PolicyTemplate title="Terms of service" updated="2026-10-16">
      <PolicySection title="No real purchases">
        <PolicyParagraph>
          Orders placed in this store are test orders. They create no contract
          of sale, no payment is taken and nothing is delivered. Spot prices
          shown here are demo data and must not be relied on for trading or
          investment decisions.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Prices">
        <PolicyParagraph>
          Product prices follow live precious-metal spot prices and change
          every few seconds. When you proceed to checkout, prices are locked
          for a limited time. The locked price is the price you pay; if the
          lock expires before you place the order, prices are refreshed.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Orders">
        <PolicyParagraph>
          An order is accepted once you receive an order confirmation. We may
          cancel an order and refund it in full if a product turns out to be
          unavailable.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Questions">
        <PolicyParagraph>
          Contact us at {CONTACT_EMAIL} with any questions about these terms.
        </PolicyParagraph>
      </PolicySection>
    </PolicyTemplate>
  )
}
