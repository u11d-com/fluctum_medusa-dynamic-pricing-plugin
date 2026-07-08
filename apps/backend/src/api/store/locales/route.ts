import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.json({
    locales: [
      { code: "en", name: "English" },
      { code: "pl", name: "Polski" },
      { code: "es", name: "Español" },
      { code: "de", name: "Deutsch" },
    ],
  });
}
