import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Heading } from "@modules/common/components/ui"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  cat,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  cat?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "category"

  const categories = await listCategories({ fields: "id,name,handle", limit: 100 }).catch(() => [])

  // Resolve cat handle → category id for product filtering
  const selectedCategory = cat ? categories.find((c) => c.handle === cat) : undefined
  const categoryId = selectedCategory?.id

  const title = selectedCategory?.name ?? "All products"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        sortBy={sort}
        categories={categories.map((c) => ({ id: c.id, name: c.name, handle: c.handle }))}
        selectedCat={cat}
      />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <Heading level="h1" size="lg" data-testid="store-page-title">{title}</Heading>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={categoryId}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
