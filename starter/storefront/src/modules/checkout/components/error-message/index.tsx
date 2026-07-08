import { Text } from "@modules/common/components/ui"

const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  if (!error) {
    return null
  }

  return (
    <Text className="pt-2 text-rose-500 text-small-regular" data-testid={dataTestid}>{error}</Text>
  )
}

export default ErrorMessage
