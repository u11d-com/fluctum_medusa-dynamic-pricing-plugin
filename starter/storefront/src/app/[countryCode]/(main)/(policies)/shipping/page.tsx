import { Metadata } from "next"
import { getRegion } from "@lib/data/regions"
import { SHIPPING_POLICY, getShippingRates } from "@lib/store-policies"
import { convertToLocale } from "@lib/util/money"
import PolicyTemplate, {
  PolicyParagraph,
  PolicySection,
} from "@modules/policies/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: "Shipping information | Fluctum",
    description: "Shipping methods, delivery times and rates.",
    alternates: { canonical: `/${countryCode}/shipping` },
  }
}

function days({ min, max }: { min: number; max: number }) {
  return min === max ? `${min} business days` : `${min}–${max} business days`
}

export default async function ShippingPage(props: Props) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  const currencyCode = region?.currency_code ?? "usd"
  const rates = getShippingRates(currencyCode)
  const methods = [
    { ...SHIPPING_POLICY.standard, rate: rates?.standard },
    { ...SHIPPING_POLICY.express, rate: rates?.express },
  ]

  return (
    <PolicyTemplate title="Shipping information" updated="2026-10-16">
      <PolicySection title="Processing time">
        <PolicyParagraph>
          Orders are packed and handed to the carrier within{" "}
          {days(SHIPPING_POLICY.handlingDays)} of payment. Every parcel is
          fully insured and requires a signature on delivery.
        </PolicyParagraph>
      </PolicySection>
      <PolicySection
        title={`Shipping methods${region?.name ? ` (${region.name})` : ""}`}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ui-border-base">
              <th className="py-2 font-medium">Method</th>
              <th className="py-2 font-medium">Delivery time</th>
              <th className="py-2 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.name} className="border-b border-ui-border-base">
                <td className="py-2">{method.name}</td>
                <td className="py-2">{days(method.transitDays)}</td>
                <td className="py-2">
                  {method.rate !== undefined
                    ? convertToLocale({
                        amount: method.rate,
                        currency_code: currencyCode,
                      })
                    : "Calculated at checkout"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PolicySection>
      <PolicySection title="Tracking">
        <PolicyParagraph>
          You receive a tracking link by email as soon as your parcel ships.
        </PolicyParagraph>
      </PolicySection>
    </PolicyTemplate>
  )
}
