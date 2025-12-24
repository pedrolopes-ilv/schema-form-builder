export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'date'
  | 'table'
  | 'masked'
  | 'email'
  | 'currency'
  | 'range'
  | 'switch'
  | 'tags'
  | 'heading'
  | 'divider'
  | 'group'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldValidation {
  // extendable validation rules (examples)
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  // Custom message shown when required validation fails (overrides renderer default)
  requiredMessage?: string
}

export interface FormField {
  id: string
  // Key used in submission payload (defaults to id if not set)
  name?: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  validation?: FieldValidation
  options?: FieldOption[] // for radio/select
  // Table-specific configuration
  table?: {
    api: {
      url: string
      method?: 'GET' | 'POST'
      headers?: Record<string, string>
      body?: string
    }
  }
  // Masked input
  mask?: string
  // Currency-specific configuration
  currency?: {
    code: string // e.g., 'BRL', 'USD'
    locale?: string // e.g., 'pt-BR'
    min?: number
    max?: number
  }
  // Range/slider configuration
  range?: {
    min: number
    max: number
    step?: number
    showValue?: boolean
  }
  // Tags/chips configuration
  tags?: {
    separator?: string
    maxTags?: number
  }
  // Heading content configuration
  heading?: {
    text: string
    level?: 1 | 2 | 3
  }
}

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterOrEqual'
  | 'lessThan'
  | 'lessOrEqual'
  | 'contains'
  | 'notContains'

export interface VisibilityCondition {
  whenField: string
  operator: ConditionOperator
  value: unknown
}

export interface GroupField extends Omit<FormField, 'type'> {
  type: 'group'
  // Children are regular fields or nested groups
  children: AnyField[]
  // Optional condition to control group visibility at render time
  condition?: VisibilityCondition
}

export type AnyField = FormField | GroupField

export interface FormSchema {
  formTitle: string
  // Top-level fields can include groups (which can nest further fields)
  fields: AnyField[]
}
