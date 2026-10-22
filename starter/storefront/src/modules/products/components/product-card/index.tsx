import { Text, clx, Surface } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"

type ProductCardProps = {
  title: string
  variantLabel?: string
  href: string
  imageThumbnail?: string | null
  images?: { url?: string }[] | null
  isFeatured?: boolean
  className?: string
  children: React.ReactNode
  withTranslateY?: boolean
}

export default function ProductCard({
  title,
  variantLabel,
  href,
  imageThumbnail,
  images,
  isFeatured,
  className,
  children,
  withTranslateY = true,
}: ProductCardProps) {
  return (
    <LocalizedClientLink href={href} className="group block h-full">
      <Surface
        data-testid="product-wrapper"
        className={clx(
          "h-full flex flex-col p-4 transition-all duration-200 group-hover:shadow-md",
          withTranslateY && "group-hover:-translate-y-0.5",
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <Thumbnail
            thumbnail={imageThumbnail}
            images={images}
            size="full"
            isFeatured={isFeatured}
            plain
          />
        </div>
        <div className="@container pt-3 flex flex-col flex-1">
          <div className="flex flex-col @[14rem]:flex-row items-start justify-between gap-x-2 gap-y-0.5">
            <Text
              className="text-sm font-medium text-ui-fg-base line-clamp-2 @[14rem]:flex-1"
              data-testid="product-title"
            >
              {title}
            </Text>
            {variantLabel && (
              <Text
                variant="muted"
                className="text-xs shrink-0 @[14rem]:pt-0.5"
              >
                {variantLabel}
              </Text>
            )}
          </div>
          {children}
        </div>
      </Surface>
    </LocalizedClientLink>
  )
}
