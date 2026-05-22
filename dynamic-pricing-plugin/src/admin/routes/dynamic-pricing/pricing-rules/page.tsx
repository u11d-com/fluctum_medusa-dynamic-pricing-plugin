import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  Container,
  Heading,
  Text,
  Table,
  Button,
  Skeleton,
  FocusModal,
  Input,
  Label,
  Badge,
  toast,
  Prompt,
} from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"
import { sdk } from "../../../lib/client"

type PricingRule = {
  id: string
  name: string
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
  created_at: string
}

type ListResponse = {
  pricing_rules: PricingRule[]
  count: number
  limit: number
  offset: number
}

type FormData = {
  name: string
  spread_factor: string
  spread_fixed: string
  premium_percentage: string
  premium_fixed: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const INITIAL_FORM: FormData = {
  name: "",
  spread_factor: "1",
  spread_fixed: "0",
  premium_percentage: "0",
  premium_fixed: "0",
}

const PAGE_SIZE = 20

// ── Create Rule Modal ─────────────────────────────────────────────────────────

function CreatePricingRuleModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  const createRule = useMutation({
    mutationFn: (data: object) =>
      sdk.client.fetch("/admin/dynamic-pricing/pricing-rules", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      toast.success("Pricing rule created")
      setOpen(false)
      setForm(INITIAL_FORM)
      setErrors({})
      onCreated()
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create rule"),
  })

  const handleSubmit = () => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (isNaN(Number(form.spread_factor))) newErrors.spread_factor = "Must be a number"
    if (isNaN(Number(form.spread_fixed))) newErrors.spread_fixed = "Must be a number"
    if (isNaN(Number(form.premium_percentage))) newErrors.premium_percentage = "Must be a number"
    if (isNaN(Number(form.premium_fixed))) newErrors.premium_fixed = "Must be a number"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createRule.mutate({
      name: form.name.trim(),
      spread_factor: Number(form.spread_factor),
      spread_fixed: Number(form.spread_fixed),
      premium_percentage: Number(form.premium_percentage),
      premium_fixed: Number(form.premium_fixed),
    })
  }

  const field = (
    key: keyof FormData,
    label: string,
    hint?: string
  ) => (
    <div className="flex flex-col gap-y-2">
      <Label>
        {label}
        {hint && (
          <Text size="small" leading="compact" className="text-ui-fg-subtle ml-1">
            ({hint})
          </Text>
        )}
      </Label>
      <Input
        value={form[key]}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value })
          setErrors({ ...errors, [key]: undefined })
        }}
      />
      {errors[key] && (
        <Text size="small" leading="compact" className="text-ui-fg-error">
          {errors[key]}
        </Text>
      )}
    </div>
  )

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        <Plus />
        Create Rule
      </Button>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={createRule.isPending}
                  >
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={handleSubmit}
                  isLoading={createRule.isPending}
                >
                  Create
                </Button>
              </div>
            </FocusModal.Header>

            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto max-w-lg flex flex-col gap-y-6 px-6 py-8">
                <div>
                  <Heading level="h2">Create Pricing Rule</Heading>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mt-1"
                  >
                    Define the factors that compose the final price for assigned
                    product variants.
                  </Text>
                </div>

                {field("name", "Name")}

                <div className="flex flex-col gap-y-4">
                  <Text size="small" leading="compact" weight="plus">
                    Spread
                  </Text>
                  {field("spread_factor", "Spread Factor", "multiplier, default 1")}
                  {field("spread_fixed", "Spread Fixed", "additive, default 0")}
                </div>

                <div className="flex flex-col gap-y-4">
                  <Text size="small" leading="compact" weight="plus">
                    Premium
                  </Text>
                  {field("premium_percentage", "Premium %", "percent, default 0")}
                  {field("premium_fixed", "Premium Fixed", "additive, default 0")}
                </div>
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}

// ── Pricing Rules Table ───────────────────────────────────────────────────────

function PricingRulesTable() {
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const offset = page * PAGE_SIZE

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["dynamic-pricing-rules", page],
    queryFn: () =>
      sdk.client.fetch<ListResponse>(
        `/admin/dynamic-pricing/pricing-rules?limit=${PAGE_SIZE}&offset=${offset}`
      ),
  })

  const deleteRule = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/dynamic-pricing/pricing-rules/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Pricing rule deleted")
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] })
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete rule"),
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Pricing Rules</Heading>
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle mt-1"
          >
            {data ? `${data.count} rule${data.count !== 1 ? "s" : ""}` : ""}
          </Text>
        </div>
        <CreatePricingRuleModal
          onCreated={() =>
            queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] })
          }
        />
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Spread Factor</Table.HeaderCell>
            <Table.HeaderCell>Spread Fixed</Table.HeaderCell>
            <Table.HeaderCell>Premium %</Table.HeaderCell>
            <Table.HeaderCell>Premium Fixed</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Table.Row key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Table.Cell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            : !data?.pricing_rules?.length
            ? (
              <Table.Row>
                <Table.Cell>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle py-4"
                  >
                    No pricing rules yet. Create one to get started.
                  </Text>
                </Table.Cell>
              </Table.Row>
            )
            : data.pricing_rules.map((rule) => (
                <Table.Row key={rule.id}>
                  <Table.Cell>
                    <Text size="small" leading="compact" weight="plus">
                      {rule.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" leading="compact">
                      {Number(rule.spread_factor).toFixed(4)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" leading="compact">
                      {Number(rule.spread_fixed).toFixed(4)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" leading="compact">
                      {Number(rule.premium_percentage).toFixed(4)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" leading="compact">
                      {Number(rule.premium_fixed).toFixed(4)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {new Date(rule.created_at).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Prompt>
                      <Prompt.Trigger asChild>
                        <Button
                          size="small"
                          variant="transparent"
                          disabled={deleteRule.isPending}
                        >
                          <Trash className="text-ui-fg-subtle" />
                        </Button>
                      </Prompt.Trigger>
                      <Prompt.Content>
                        <Prompt.Header>
                          <Prompt.Title>Delete "{rule.name}"?</Prompt.Title>
                          <Prompt.Description>
                            This will permanently delete the pricing rule. Any
                            variants assigned to this rule must be reassigned.
                          </Prompt.Description>
                        </Prompt.Header>
                        <Prompt.Footer>
                          <Prompt.Cancel>Cancel</Prompt.Cancel>
                          <Prompt.Action
                            onClick={() => deleteRule.mutate(rule.id)}
                          >
                            Delete
                          </Prompt.Action>
                        </Prompt.Footer>
                      </Prompt.Content>
                    </Prompt>
                  </Table.Cell>
                </Table.Row>
              ))}
        </Table.Body>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {data?.count} rules · page {page + 1} of {totalPages}
          </Text>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PricingRulesPage = () => (
  <div className="flex flex-col gap-y-4 p-6">
    <div>
      <Heading level="h1">Pricing Rules</Heading>
      <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
        Manage pricing rules and assign them to product variants.
      </Text>
    </div>
    <PricingRulesTable />
  </div>
)

export const config = defineRouteConfig({
  label: "Pricing Rules",
})

export default PricingRulesPage
