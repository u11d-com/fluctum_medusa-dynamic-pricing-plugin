import { Text } from "@modules/common/components/ui"

type AddressSummaryBlockProps = {
  title: string
  lines: Array<string | null | undefined>
  dataTestId: string
}

const AddressSummaryBlock = ({
  title,
  lines,
  dataTestId,
}: AddressSummaryBlockProps) => {
  return (
    <div className="flex flex-col w-1/3" data-testid={dataTestId}>
      <Text as="span" variant="label" className="mb-1">{title}</Text>
      {lines.filter(Boolean).map((line, index) => (
        <Text key={`${line}-${index}`} variant="muted">
          {line}
        </Text>
      ))}
    </div>
  )
}

export default AddressSummaryBlock
