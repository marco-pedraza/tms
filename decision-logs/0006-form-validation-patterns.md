# 3. Standardize Zod Validation with Shared Schemas and Bidirectional Transformation

Date: 2025-09-17

## Status

Accepted

## Context

The team had been experiencing inconsistencies in form validation code across the TMS application.

Common issues observed:

- Manual TypeScript conditionals for data transformation instead of centralized logic
- Inline validation scattered throughout components
- Duplicate validation logic across similar forms
- Mixed approaches to handling optional fields
- Backend data transformation handled inconsistently in each form

The lack of standardization was causing:

- Increased code review time due to inconsistent patterns
- Higher maintenance burden from duplicated validation logic
- Potential bugs from manual transformation logic
- Slower onboarding for new team members
- Inconsistent AI code generation patterns due to lack of clear standards

## Decision

We will adopt a standardized Zod validation strategy with the following principles:

### Core Architecture

- **Bidirectional transformation** using Zod for both UI → Backend (validation/submit) and Backend → UI (default values parsing)
- **Type safety** through Zod's inference utilities to generate typing from schemas
- **Factory functions** for translated error messages and reusable, configurable schemas
- **Centralized shared schemas** in `/schemas/` for primitive type validations and transformations
- **Domain-specific schemas** co-located with their respective domain code

### Schema Organization

| Schema Type     | Location                                                                              | Purpose                                                      | Example                                                  |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Primitive Types | `/schemas/string.ts`, `/schemas/number.ts`, `/schemas/date.ts`, `/schemas/contact.ts` | Reusable validations with UI ↔ Backend transformations      | `requiredStringSchema()`, `optionalIntegerSchema()`      |
| Domain Specific | `/[domain]/[domain].schemas.ts`                                                       | Complex business logic, discriminated unions, composition    | `createSeatDiagramFormSchema()`, `createBusFormSchema()` |
| Default Values  | Inline with form schemas                                                              | Transform backend data to form-ready format using `z.coerce` | `createDefaultValuesSchema()`                            |

### Bidirectional Transformation Pattern

Each form requires two schemas to handle the complete data flow:

```typescript
// Backend → Frontend (default values parsing)
const createDefaultValuesSchema = z.object({
  name: z.coerce.string().default(""),
  description: z.coerce
    .string()
    .transform((val) => (val === "null" ? "" : val))
    .default(""),
  count: z.coerce.string().default(""),
  date: z.coerce.string().default(""),
});

// Frontend → Backend (validation and transformation)
const createEntityFormSchema = (tValidations) =>
  z.object({
    name: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    count: requiredIntegerSchema(tValidations),
    date: requiredDateSchema(tValidations),
  });
```

### Type Inference Standards

```typescript
export type EntityFormValues = z.output<
  ReturnType<typeof createEntityFormSchema>
>;
type EntityFormRawValues = z.input<ReturnType<typeof createEntityFormSchema>>;
```

### Naming Convention for Shared Schemas

- Use `required` and `optional` prefixes to make behavior and output types immediately clear
- Example: `requiredStringSchema()`, `optionalIntegerSchema()`

## Consequences

### Positive

- ✅ **Consistency**: Unified validation patterns across all forms reduce code review inconsistencies
- ✅ **AI Code Generation**: Standardized patterns enable more consistent AI-generated validation code
- ✅ **Type Safety**: Automatic type inference from schemas eliminates manual type definitions and potential mismatches
- ✅ **Maintainability**: Centralized validation logic allows changes in one place to affect all consumers
- ✅ **Developer Experience**: Clear patterns with `required`/`optional` naming make it easier for new developers
- ✅ **Internationalization**: Built-in support for translated error messages through factory pattern
- ✅ **Bidirectional Transformation**: Single source of truth for data flow in both directions
- ✅ **Reduced Boilerplate**: Shared schemas and `z.coerce` eliminate duplicate transformation logic

### Negative

- ❗ **Learning Curve**: Team members need to learn the bidirectional transformation concept and new patterns
- ❗ **Schema Complexity**: Some complex forms (like discriminated unions) may require TypeScript error suppressions

## AI Code Generation Patterns and Anti-patterns

_The following section provides specific guidance for AI systems generating validation code._

### Standard Patterns for AI Generation

```typescript
// ✅ Always create both schemas for forms
const createDefaultValuesSchema = z.object({
  name: z.coerce.string().default(""),
  description: z.coerce
    .string()
    .transform((val) => (val === "null" ? "" : val))
    .default(""),
  amount: z.coerce.string().default(""),
  isActive: z.boolean().default(true),
});

const createEntityFormSchema = (tValidations) =>
  z.object({
    name: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    amount: requiredFloatSchema(tValidations),
    isActive: z.boolean(),
  });

// ✅ Use type inference
export type EntityFormValues = z.output<
  ReturnType<typeof createEntityFormSchema>
>;
type EntityFormRawValues = z.input<ReturnType<typeof createEntityFormSchema>>;

// ✅ Apply schemas in forms
const rawDefaultValues: EntityFormRawValues = createDefaultValuesSchema.parse(
  defaultValues ?? {}
);
const form = useForm({
  defaultValues: rawDefaultValues,
  validators: { onSubmit: createEntityFormSchema(tValidations) },
});
```

### Anti-patterns to Avoid

```typescript
// ❌ Single schema without bidirectional transformation
const EntitySchema = z.object({
  name: z.string().min(1),
  amount: z.number(),
});

// ❌ Manual default value transformation
const defaultVals = defaultValues
  ? {
      name: defaultValues.name || "",
      amount: defaultValues.amount?.toString() || "",
    }
  : { name: "", amount: "" };

// ❌ Static schemas without factory functions
const StaticSchema = z.object({
  name: z.string().min(1, "Required"),
});

// ❌ Manual type definitions instead of inference
interface FormValues {
  name: string;
  amount: number;
}

// ❌ Mixed transformation patterns
const processValue = (val) => {
  if (!val) return null;
  if (val === "null") return "";
  return val.trim();
};
```

### Required Schema Imports

```typescript
import { z } from "zod";
import { UseValidationsTranslationsResult } from "@/types/translations";
import {
  requiredStringSchema,
  optionalStringSchema,
  requiredIntegerSchema,
  optionalIntegerSchema,
  requiredFloatSchema,
  optionalFloatSchema,
} from "@/schemas/number";
import { requiredDateSchema, optionalDateSchema } from "@/schemas/date";
import {
  optionalPhoneSchema,
  optionalEmailSchema,
  optionalUrlSchema,
} from "@/schemas/contact";
```
