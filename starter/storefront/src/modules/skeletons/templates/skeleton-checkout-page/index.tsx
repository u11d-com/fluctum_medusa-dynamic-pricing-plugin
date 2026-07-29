import repeat from "@lib/util/repeat"
import { Surface } from "@modules/common/components/ui"
import SkeletonOrderSummary from "@modules/skeletons/components/skeleton-order-summary"

const SkeletonCheckoutStep = () => {
  return (
    <Surface className="p-6 flex flex-col gap-y-4">
      <div className="w-40 h-6 bg-gray-200 animate-pulse" />
      <div className="w-full h-24 bg-gray-100 animate-pulse" />
    </Surface>
  )
}

const SkeletonCheckoutPage = () => {
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
        <div className="w-full grid grid-cols-1 gap-y-8">
          {repeat(4).map((index) => (
            <SkeletonCheckoutStep key={index} />
          ))}
        </div>
        <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0">
          <Surface className="w-full p-6 flex flex-col gap-y-6">
            <div className="w-48 h-4 bg-gray-100 animate-pulse" />
            <SkeletonOrderSummary />
            <div className="flex flex-col gap-y-4">
              {repeat(2).map((index) => (
                <div key={index} className="flex gap-x-4 items-center">
                  <div className="w-16 h-16 bg-gray-200 animate-pulse" />
                  <div className="flex flex-col gap-y-2 flex-1">
                    <div className="w-3/4 h-4 bg-gray-200 animate-pulse" />
                    <div className="w-1/2 h-4 bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCheckoutPage
