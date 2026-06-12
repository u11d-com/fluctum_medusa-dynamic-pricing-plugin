import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import { Surface } from "@modules/common/components/ui"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div className="flex-1 bg-ui-bg-subtle min-h-screen" data-testid="account-page">
        <div className="content-container max-w-5xl mx-auto py-12">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 small:py-12 bg-ui-bg-subtle min-h-screen" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto flex flex-col gap-y-6">
        <Surface>
          <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] p-6 gap-6">
            <div><AccountNav customer={customer} /></div>
            <div className="flex-1">{children}</div>
          </div>
        </Surface>
      </div>
    </div>
  )
}

export default AccountLayout
