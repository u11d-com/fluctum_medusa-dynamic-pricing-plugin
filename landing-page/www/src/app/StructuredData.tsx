import { faqs } from "./faq-data";

// Escapes characters that could break out of the <script> tag context
// when the JSON payload is serialized into the page HTML.
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function StructuredData() {
  const graph = [
    {
      "@type": "Organization",
      "@id": "https://u11d.com/#organization",
      name: "u11d",
      url: "https://u11d.com",
      logo: "https://u11d.com/static/u11d-color-136ce418fbbb940b43748ef1bef30220.svg",
      sameAs: ["https://github.com/u11d-com"],
    },
    {
      "@type": "WebSite",
      "@id": "https://fluctum.io/#website",
      url: "https://fluctum.io",
      name: "Fluctum",
      description:
        "Real-time dynamic pricing plugin for Medusa. Live spot prices via SSE and checkout price locks.",
      publisher: { "@id": "https://u11d.com/#organization" },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": "https://fluctum.io/#software",
      name: "Fluctum",
      description:
        "Open-source dynamic pricing plugin for Medusa stores. Streams live spot prices via Server-Sent Events and locks checkout prices for order validation.",
      codeRepository:
        "https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin",
      programmingLanguage: "TypeScript",
      runtimePlatform: "Medusa",
      license: "https://opensource.org/license/mit/",
      isAccessibleForFree: true,
      downloadUrl: "https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing",
      author: { "@id": "https://u11d.com/#organization" },
      publisher: { "@id": "https://u11d.com/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://fluctum.io/#faq",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
