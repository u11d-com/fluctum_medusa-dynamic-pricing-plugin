import { Metadata } from "next"
import { CONTACT_EMAIL, RETURN_POLICY } from "@lib/store-policies"
import PolicyTemplate, {
  PolicyParagraph,
  PolicySection,
} from "@modules/policies/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: "Return policy | Fluctum",
    description: `Return any item within ${RETURN_POLICY.days} days by mail. Returns are free.`,
    alternates: { canonical: `/${countryCode}/returns` },
  }
}

export default function ReturnsPage() {
  return (
    <PolicyTemplate title="Return policy" updated="2026-10-16">
      <PolicySection title="Return window">
        <PolicyParagraph>
          You can return any product within {RETURN_POLICY.days} days of
          delivery for a full refund of the price you paid at checkout. Items
          must be returned unused, in their original packaging and protective
          capsule.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="How to return">
        <PolicyParagraph>
          Returns are made by mail. Email {CONTACT_EMAIL} with your order
          number and we will send you a prepaid, insured return label. Return
          shipping is free.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Refunds">
        <PolicyParagraph>
          Refunds are issued to the original payment method within 5 business
          days of the return arriving at our warehouse. Because prices are
          locked at checkout, the refund equals the locked price, independent
          of the current spot price.
        </PolicyParagraph>
      </PolicySection>
    </PolicyTemplate>
  )
}
