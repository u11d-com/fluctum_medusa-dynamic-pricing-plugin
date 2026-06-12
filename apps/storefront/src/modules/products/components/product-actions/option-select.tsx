import { HttpTypes } from "@medusajs/types"
import { ChoiceCardButton, clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          return (
            <ChoiceCardButton
              onClick={() => updateOption(option.id, v)}
              key={v}
              selected={v === current}
              className={clx("text-small-regular h-10 p-2 flex-1", {
                "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                  v !== current,
              })}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </ChoiceCardButton>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
