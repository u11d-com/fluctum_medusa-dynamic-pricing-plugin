import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import RecommendedProducts from "@modules/home/components/recommended-products"
import { Surface } from "@modules/common/components/ui"

const CartTemplate = ({
  cart,
  customer,
  countryCode,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  countryCode: string
}) => {
  return (
    <div className="bg-ui-bg-subtle min-h-screen">
      <div className="py-12">
        <div className="content-container" data-testid="cart-container">
          {cart?.items?.length ? (
            <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
              <Surface className="flex flex-col p-6 gap-y-6">
                {!customer && (
                  <>
                    <SignInPrompt />
                    <Divider />
                  </>
                )}
                <ItemsTemplate cart={cart} />
              </Surface>
              <div className="relative">
                <div className="flex flex-col gap-y-8 sticky top-12">
                  {cart && cart.region && (
                    <>
                      <Surface className="p-6">
                        <Summary cart={cart} />
                      </Surface>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <EmptyCartMessage />
            </div>
          )}
        </div>
      </div>
      <RecommendedProducts countryCode={countryCode} />
    </div>
  )
}

export default CartTemplate
