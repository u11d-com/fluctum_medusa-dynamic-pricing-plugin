import { EmptyState } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <EmptyState
      title="Cart"
      description="You don't have anything in your cart. Let's change that, use the link below to start browsing our products."
      action={<InteractiveLink href="/store">Explore products</InteractiveLink>}
      data-testid="empty-cart-message"
    />
  )
}

export default EmptyCartMessage
