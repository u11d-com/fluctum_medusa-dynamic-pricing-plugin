"use client"

import { clx } from "@modules/common/components/ui"
import React, { Fragment } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogPanel,
  Description as DialogDescription,
  Transition,
  TransitionChild,
  DialogTitle,
} from "@headlessui/react"

import { ModalProvider, useModal } from "@lib/context/modal-context"
import { IconButton } from "@modules/common/components/ui"
import X from "@modules/common/icons/x"

type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large"
  search?: boolean
  children: React.ReactNode
  "data-testid"?: string
}

const Modal = ({
  isOpen,
  close,
  size = "medium",
  search = false,
  children,
  "data-testid": dataTestId,
}: ModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={close}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opacity-75 backdrop-blur-md  h-screen" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-hidden">
          <div
            className={clx(
              "flex min-h-full h-full justify-center p-4 text-center",
              {
                "items-center": !search,
                "items-start": search,
              },
            )}
          >
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                data-testid={dataTestId}
                className={clx(
                  "flex flex-col justify-start w-full transform p-5 text-left align-middle transition-all max-h-[75vh] h-fit",
                  {
                    "max-w-md": size === "small",
                    "max-w-xl": size === "medium",
                    "max-w-3xl": size === "large",
                    "bg-transparent shadow-none": search,
                    "bg-ui-bg-base shadow-xl border rounded-rounded": !search,
                  },
                )}
              >
                <ModalProvider close={close}>{children}</ModalProvider>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { close } = useModal()
  const t = useTranslations("common")

  return (
    <DialogTitle className="flex items-center justify-between">
      <div className="text-large-semi">{children}</div>
      <div>
        <IconButton
          type="button"
          onClick={close}
          aria-label={t("closeModal")}
          data-testid="close-modal-button"
        >
          <X size={20} />
        </IconButton>
      </div>
    </DialogTitle>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DialogDescription className="flex text-small-regular text-ui-fg-base items-center justify-center pt-2 pb-4 h-full">
      {children}
    </DialogDescription>
  )
}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-center">{children}</div>
}

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex items-center justify-end gap-x-4">{children}</div>
}

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
