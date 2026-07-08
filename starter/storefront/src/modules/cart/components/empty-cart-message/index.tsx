import { getTranslations } from "next-intl/server"

import { EmptyState } from "@modules/common/components/ui"
import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = async () => {
  const t = await getTranslations("cart")

  return (
    <EmptyState
      title={t("emptyTitle")}
      description={t("emptyDescription")}
      action={<InteractiveLink href="/store">{t("exploreProducts")}</InteractiveLink>}
      data-testid="empty-cart-message"
    />
  )
}

export default EmptyCartMessage
