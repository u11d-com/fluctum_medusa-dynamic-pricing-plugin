import { Metadata } from "next"
import { BUILDER, CONTACT_EMAIL } from "@lib/store-policies"
import PolicyTemplate, {
  PolicyParagraph,
  PolicySection,
} from "@modules/policies/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: "Contact us | Fluctum",
    description: `Contact the Fluctum store at ${CONTACT_EMAIL}.`,
    alternates: { canonical: `/${countryCode}/contact` },
  }
}

export default function ContactPage() {
  return (
    <PolicyTemplate title="Contact us" updated="2026-10-16">
      <PolicySection title="Email">
        <PolicyParagraph>
          Write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand-primary underline"
          >
            {CONTACT_EMAIL}
          </a>
          . We answer within one business day.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection title="Company">
        <PolicyParagraph>
          This demo store and the Fluctum framework are built by{" "}
          <a href={BUILDER.url} className="text-brand-primary underline">
            u11d
          </a>
          , a software house in Szczecin, Poland. Questions about using Fluctum
          for your own store are welcome at the same address.
        </PolicyParagraph>
      </PolicySection>
    </PolicyTemplate>
  )
}
