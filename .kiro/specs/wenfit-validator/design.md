# Design Document: Wenfit Validator

## Overview

The Wenfit Validator is a universal, type-safe validation library for TypeScript/JavaScript that works seamlessly across frontend and backend environments. The design follows a layered architecture with a framework-agnostic core engine, optional framework adapters, and a plugin system for extensibility.

The validator uses a fluent API for schema definition, supports both synchronous and asynchronous validation, provides automatic TypeScript type inference, and generates structured, path-aware errors suitable for internationalization. The core principle is "define once, validate everywhere" - a single schema definition works in React, Vue, Angular, Node.js, Express, and NestJS without modification.

Key design decisions:
- **Immutable schemas**: All schema methods return new schema instances
- **Lazy evaluation**: Validation only occurs when parse/safeParse is called
- **Type-first**: TypeScript types are inferred from schemas, not manually defined
- **Error accumulation**: All validation errors are collected and returned together
- **Zero dependencies**: Core engine has no external dependencies for minimal bundle size

## Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────┐
│           Framework Adapters (Optional)             │
│  React Hook │ Vue Composable │ Angular Service     │
│  Express Middleware │ NestJS Decorators            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Public API Layer                       │
│  string() │ number() │ object() │ array()          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Core Validation Engine                 │
│  Schema Base │ Validators │ Error Handling         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Utilities & Helpers                    │
│  Type Inference │ Path Tracking │ Transformers     │
└─────────────────────────────────────────────────────┘
```

### Module Organization

- **core/**: Base schema classes and primitive validators
- **async/**: Async validation support and helpers
- **errors/**: Error types, codes, and formatting
- **transformers/**: Built-in data transformation functions
- **adapters/**: Framework-specific integration layers
- **plugins/**: Plugin system and built-in plugins
- **types/**: TypeScript type utilities and inference helpers

## Components and Interfaces

### Base Schema Class

The foundation of all validation schemas:

```typescript
abstract class Schema<TInput, TOutput = TInput> {
  // Core validation methods
  abstract _parse(input: unknown, ctx: ParseContext): ParseResult<TOutput>;

  parse(input: unknown): TOutput {
    const result = this.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.errors);
    }
    return result.data;
  }

  safeParse(input: unknown): ValidationResult<TOutput> {
    const ctx = new ParseContext();
    const result = this._parse(input, ctx);
    return ctx.toValidationResult(result);
  }

  // Schema composition methods
  refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message: string | ErrorOptions
  ): Schema<TInput, TOutput>;

  transform<U>(fn: (value: TOutput) => U): Schema<TInput, U>;

  optional(): Schema<TInput | undefined, TOutput | undefined>;
  nullable(): Schema<TInput | null, TOutput | null>;
  default(value: TOutput): Schema<TInput | undefined, TOutput>;

  // Utility methods
  toJSONSchema(): JSONSchema;
}
```

### Primitive Schemas

**StringSchema**:
```typescript
class StringSchema extends Schema<string, string> {
  private constraints: StringConstraints = {};

  min(length: number, message?: string): StringSchema;
  max(length: number, message?: string): StringSchema;
  length(exact: number, message?: string): StringSchema;
  pattern(regex: RegExp, message?: string): StringSchema;
  email(message?: string): StringSchema;
  url(message?: string): StringSchema;
  trim(): StringSchema;  // transformer
  toLowerCase(): StringSchema;  // transformer
  toUpperCase(): StringSchema;  // transformer
}
```

**NumberSchema**:
```typescript
class NumberSchema extends Schema<number, number> {
  private constraints: NumberConstraints = {};

  min(value: number, message?: string): NumberSchema;
  max(value: number, message?: string): NumberSchema;
  int(message?: string): NumberSchema;
  positive(message?: string): NumberSchema;
  negative(message?: string): NumberSchema;
  finite(message?: string): NumberSchema;
}
```

**Bo>(keys: K[]): ObjectSchema<Pick<T, K>>;
  omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>>;
  extend<U extends Record<string, Schema<any>>>(
    extension: U
  ): ObjectSchema<T & U>;
  merge<U extends Record<string, Schema<any>>>(
    other: ObjectSchema<U>
  ): ObjectSchema<T & U>;
}
```

### Array Schema

Validates arrays with element type constraints:

```typescript
class ArraySchema<T extends Schema<any>> extends Schema<
  Array<Infer<T>>,
  Array<Infer<T>>
> {
  constructor(private element: T) {}

  min(length: number, message?: string): ArraySchema<T>;
  max(length: number, message?: string): ArraySchema<T>;
  length(exact: number, message?: string): ArraySchema<T>;
  nonempty(message?: string): ArraySchema<T>;
}
```

### Union and Intersection Schemas

```typescript
class UnionSchema<T extends Schema<any>[]> extends Schema<
  Infer<T[number]>,
  Infer<T[number]>
> {
  constructor(private options: T) {}
}

class IntersectionSchema<T extends Schema<any>[]> extends Schema<
  UnionToIntersection<Infer<T[number]>>,
  UnionToIntersection<Infer<T[number]>>
> {
  constructor(private schemas: T) {}
}
```

### Validation Context

Tracks validation state and errors during parsing:

```typescript
class ParseContext {
  private path: (string | number)[] = [];
  private errors: ValidationError[] = [];
  private isAsync: boolean = false;

  addError(error: ValidationError): void;
  pushPath(segment: string | number): void;
  popPath(): void;
  getCurrentPath(): string[];
  markAsync(): void;
  toValidationResult<T>(result: ParseResult<T>): ValidationResult<T>;
}
```

### Validation Result Types

```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

interface ValidationError {
  path: string[];
  message: string;
  code: string;
  meta?: Record<string, any>;
}

type ParseResult<T> = T | Promise<T> | typeof INVALID;
const INVALID = Symbol('INVALID');
```

## Data Models

### Error Codes

Standardized error codes for all validation failures:

```typescript
const ErrorCodes = {
  // Type errors
  INVALID_TYPE: 'invalid_type',

  // String errors
  STRING_MIN: 'string.min',
  STRING_MAX: 'string.max',
  STRING_LENGTH: 'string.length',
  STRING_PATTERN: 'string.pattern',
  STRING_EMAIL: 'string.email',
  STRING_URL: 'string.url',

  // Number errors
  NUMBER_MIN: 'number.min',
  NUMBER_MAX: 'number.max',
  NUMBER_INT: 'number.int',
  NUMBER_POSITIVE: 'number.positive',
  NUMBER_NEGATIVE: 'number.negative',
  NUMBER_FINITE: 'number.finite',

  // Array errors
  ARRAY_MIN: 'array.min',
  ARRAY_MAX: 'array.max',
  ARRAY_LENGTH: 'array.length',

  // Object errors
  REQUIRED: 'required',
  UNKNOWN_KEYS: 'unknown_keys',

  // Enum errors
  ENUM_INVALID: 'enum.invalid',

  // Custom errors
  CUSTOM: 'custom',
} as const;
```

### Schema Configuration

Internal configuration objects for each schema type:

```typescript
interface StringConstraints {
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  length?: { value: number; message?: string };
  pattern?: { regex: RegExp; message?: string };
  email?: { message?: string };
  url?: { message?: string };
}

interface NumberConstraints {
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  int?: { message?: string };
  positive?: { message?: string };
  negative?: { message?: string };
  finite?: { message?: string };
}

interface ArrayConstraints {
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  length?: { value: number; message?: string };
}
```

### Type Inference Utilities

```typescript
// Extract TypeScript type from schema
type Infer<T extends Schema<any, any>> = T extends Schema<any, infer O> ? O : never;

// Helper for union to intersection conversion
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
```

### Async Validation Support

```typescript
interface AsyncRule<T> {
  predicate: (value: T) => Promise<boolean>;
  message: string | ((value: T) => string);
  code?: string;
}

class AsyncValidator<T> {
  private rules: AsyncRule<T>[] = [];

  addRule(rule: AsyncRule<T>): void;
  async validate(value: T, ctx: ParseContext): Promise<boolean>;
}
```

### Transformer Pipeline

```typescript
interface Transformer<TInput, TOutput> {
  transform: (value: TInput) => TOutput;
}

class TransformerPipeline<TInput, TOutput> {
  private transformers: Transformer<any, any>[] = [];

  add<U>(transformer: Transformer<TOutput, U>): TransformerPipeline<TInput, U>;
  execute(value: TInput): TOutput;
}
```

### Plugin System

```typescript
interface Plugin {
  name: string;
  install(validator: typeof Validator): void;
}

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void;
  get(name: string): Plugin | undefined;
  has(name: string): boolean;
}
```

### Framework Adapters

**React Adapter**:
```typescript
interface UseValidatorOptions<T> {
  schema: Schema<any, T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
}

interface UseValidatorReturn<T> {
  validate: (data: unknown) => Promise<ValidationResult<T>>;
  errors: ValidationError[];
  isValidating: boolean;
  getFieldError: (path: string) => ValidationError | undefined;
  clearErrors: () => void;
}

function useValidator<T>(options: UseValidatorOptions<T>): UseValidatorReturn<T>;
```

**Express Adapter**:
```typescript
interface ValidateOptions {
  schema: Schema<any, any>;
  source?: 'body' | 'query' | 'params';
  onError?: (errors: ValidationError[], req: Request, res: Response) => void;
}

function validate(options: ValidateOptions): RequestHandler;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parse throws on invalid input
*For any* schema and invalid input that fails validation, calling parse should throw a ValidationError containing all validation failures.
**Validates: Requirements 1.2, 24.1**

### Property 2: SafeParse never throws
*For any* schema and any input (valid or invalid), calling safeParse should never throw an exception and always return a ValidationResult object.
**Validates: Requirements 1.3**

### Property 3: Type validation rejects wrong types
*For any* primitive schema (string, number, boolean, date) and any input of a different type, validation should fail with an appropriate type error.
**Validates: Requirements 2.1, 3.1, 4.1, 4.2**

### Property 4: Error codes match constraint violations
*For any* schema with constraints (min, max, pattern, email, etc.) and input that violates a specific constraint, the validation error should have the correct error code corresponding to that constraint.
**Validates: Requirements 2.8, 3.7**

### Property 5: Enum validation accepts only allowed values
*For any* enum schema with a set of allowed values and any input, validation should succeed if and only if the input matches one of the allowed values.
**Validates: Requirements 5.1**

### Property 6: Enum errors include metadata
*For any* enum schema and invalid input, the validation error should have code "enum.invalid" and include the allowed values in the metadata.
**Validates: Requirements 5.4**

### Property 7: Object schemas validate all properties
*For any* object schema with property schemas and any input object, each property should be validated according to its corresponding schema.
**Validates: Requirements 6.1**

### Property 8: Error paths track nested locations
*For any* nested schema (object or array) and invalid input, validation errors should include paths as arrays of property names and indices indicating the exact location of each error.
**Validates: Requirements 6.2, 7.3, 12.3**

### Property 9: Missing required properties produce errors
*For any* object schema with required properties and input missing one or more required properties, validation should fail with errors containing the paths to the missing properties.
**Validates: Requirements 6.5**

### Property 10: Array schemas validate all elements
*For any* array schema with an element schema and any input array, each element should be validated according to the element schema.
**Validates: Requirements 7.1**

### Property 11: Union accepts any matching member
*For any* union schema with member schemas and input that matches at least one member schema, validation should succeed.
**Validates: Requirements 8.1**

### Property 12: Union errors include all member failures
*For any* union schema and input that matches no member schemas, validation should fail with errors from all attempted member validations.
**Validates: Requirements 8.2**

### Property 13: Intersection requires all members
*For any* intersection schema with member schemas and any input, validation should succeed if and only if the input satisfies all member schemas.
**Validates: Requirements 8.3**

### Property 14: Async schemas return promises
*For any* schema with async validation rules, calling safeParse should return a Promise that resolves to a ValidationResult.
**Validates: Requirements 9.1**

### Property 15: Async validation errors include custom messages
*For any* schema with async refine rules that fail and any input, the validation error should include the custom error message provided to the refine method.
**Validates: Requirements 9.3**

### Property 16: Async validation runs after sync validation
*For any* schema with both synchronous and asynchronous validation rules and input that fails synchronous validation, the asynchronous validation rules should not execute.
**Validates: Requirements 9.4**

### Property 17: Transformers apply after validation
*For any* schema with transform methods and valid input, the transformation should be applied after validation succeeds and the result should contain the transformed data.
**Validates: Requirements 10.1**

### Property 18: Transformers execute in order
*For any* schema with multiple transform methods and valid input, the transformations should be applied in the order they were defined on the schema.
**Validates: Requirements 10.5**

### Property 19: Transformed data appears in results
*For any* schema with transform methods and valid input, the successful ValidationResult should contain the transformed data, not the original input.
**Validates: Requirements 10.6**

### Property 20: Custom refine errors include messages
*For any* schema with refine rules where the predicate returns false and any input, the validation error should include the custom error message provided to the refine method.
**Validates: Requirements 11.2**

### Property 21: Custom rules run after built-in rules
*For any* schema with both built-in validation rules and custom refine rules and input that fails built-in validation, the custom refine rules should not execute.
**Validates: Requirements 11.5**

### Property 22: Validation errors have complete structure
*For any* validation failure, each ValidationError should contain path (array of strings/numbers), message (string), code (string in dot-notation format), and optional meta (object with relevant constraint values).
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

### Property 23: All validation errors are returned
*For any* schema and input with multiple validation failures, the ValidationResult should contain all validation errors, not just the first one.
**Validates: Requirements 12.5**

### Property 24: Plugins affect all schemas
*For any* registered plugin that adds validation rules and any schema created after registration, the plugin's validation rules should be available and executed for that schema.
**Validates: Requirements 18.2**

### Property 25: Plugin rules execute in registration order
*For any* multiple registered plugins and any schema, the plugin validation rules should execute in the order the plugins were registered.
**Validates: Requirements 18.5**

### Property 26: Custom message templates are used
*For any* registered custom error message template and validation failure with matching error code, the validation error should use the custom message template instead of the default message.
**Validates: Requirements 19.3**

### Property 27: Message templates substitute placeholders
*For any* error message template with placeholders and validation failure, the error message should have placeholder values substituted with actual constraint values.
**Validates: Requirements 19.4**

### Property 28: JSON Schema conversion preserves structure
*For any* schema (primitive, object, array) with validation constraints, calling toJSONSchema should return a valid JSON Schema that represents the same validation rules and constraints.
**Validates: Requirements 20.2, 20.3, 20.4, 20.5, 20.6**

### Property 29: Optional schemas accept undefined
*For any* schema with optional modifier and undefined input, validation should succeed.
**Validates: Requirements 21.1**

### Property 30: Nullable schemas accept null
*For any* schema with nullable modifier and null input, validation should succeed.
**Validates: Requirements 21.2**

### Property 31: Optional nullable schemas accept both
*For any* schema with both optional and nullable modifiers, validation should succeed for both undefined and null inputs.
**Validates: Requirements 21.3**

### Property 32: Missing required fields have correct error code
*For any* object schema with required fields and input missing a required field, the validation error should have code "required".
**Validates: Requirements 21.4**

### Property 33: Default values apply for undefined
*For any* schema with a default value and undefined input, validation should succeed and the result should contain the default value.
**Validates: Requirements 22.1**

### Property 34: Default values don't apply for null
*For any* schema with a default value and null input, the default value should not be applied and validation should proceed with null.
**Validates: Requirements 22.2**

### Property 35: Defaults apply before validation
*For any* schema with a default value and validation rules, when input is undefined, the default value should be applied before validation rules are checked.
**Validates: Requirements 22.3**

### Property 36: Malformed input handled gracefully
*For any* schema and malformed input (e.g., circular references, invalid types), validation should fail gracefully with appropriate error messages without crashing.
**Validates: Requirements 24.5**

### Property 37: Async exceptions become validation errors
*For any* schema with async refine rules that throw exceptions and any input, the exception should be caught and converted to a validation error.
**Validates: Requirements 24.6**

## Error Handling

### Error Types

The validator uses a custom `ValidationError` class that extends the standard Error:

```typescript
class ValidationError extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }

  format(): string {
    return this.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
  }

  flatten(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const error of this.errors) {
      const key = error.path.join('.');
      if (!result[key]) result[key] = [];
      result[key].push(error.message);
    }
    return result;
  }
}
```

### Error Recovery

- **Parse method**: Throws ValidationError on failure, suitable for server-side validation where errors should halt execution
- **SafeParse method**: Returns ValidationResult, suitable for client-side validation where errors should be displayed to users
- **Async validation**: Exceptions in async predicates are caught and converted to validation errors
- **Circular references**: Detected using a WeakSet to track visited objects, preventing infinite loops
- **Stack overflow**: Array validation uses iteration instead of recursion for large arrays

### Error Message Customization

```typescript
// Global message templates
Validator.setErrorMessages({
  'string.email': 'Please enter a valid email address',
  'string.min': 'Must be at least {{min}} characters',
  'number.min': 'Must be at least {{min}}',
});

// Per-schema customization
const schema = string().email('Invalid email format');
const schema2 = number().min(0, 'Must be non-negative');
```

## Testing Strategy

The Wenfit Validator will be tested using a dual approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Property-Based Testing

Property-based testing will be implemented using [fast-check](https://github.com/dubzzz/fast-check), a mature TypeScript property-based testing library similar to QuickCheck. Fast-check generates random test cases to verify that properties hold across all inputs, making it ideal for validation logic.

**Configuration**:
- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: wenfit-validator, Property {number}: {property_text}`
- Tests organized by component (primitives, objects, arrays, async, etc.)

**Property Test Coverage**:
- Each correctness property from the design document will be implemented as a property-based test
- Generators will be created for schemas, valid inputs, and invalid inputs
- Properties will verify invariants across randomly generated test cases

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: wenfit-validator, Property 2: SafeParse never throws
test('safeParse never throws for any input', () => {
  fc.assert(
    fc.property(
      fc.anything(),  // any possible input
      schemaArbitrary(),  // random schema generator
      (input, schema) => {
        // Should never throw
        expect(() => schema.safeParse(input)).not.toThrow();

        // Should always return ValidationResult
        const result = schema.safeParse(input);
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result).toHaveProperty('data');
        } else {
          expect(result).toHaveProperty('errors');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points that complement property-based tests.

**Unit Test Coverage**:
- Specific validation examples (e.g., valid email formats, invalid URLs)
- Edge cases (empty strings, zero, negative numbers, boundary values)
- Error message formatting and structure
- Framework adapter integration (React hooks, Express middleware)
- Plugin system registration and execution
- JSON Schema export for known schemas

**Example Unit Test**:
```typescript
describe('StringSchema', () => {
  test('validates email format', () => {
    const schema = string().email();

    expect(schema.safeParse('test@example.com').success).toBe(true);
    expect(schema.safeParse('invalid-email').success).toBe(false);
  });

  test('email error has correct code', () => {
    const schema = string().email();
    const result = schema.safeParse('invalid');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe('string.email');
    }
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── primitives/
│   │   ├── string.test.ts
│   │   ├── number.test.ts
│   │   ├── boolean.test.ts
│   │   ├── date.test.ts
│   │   └── enum.test.ts
│   ├── complex/
│   │   ├── object.test.ts
│   │   ├── array.test.ts
│   │   ├── union.test.ts
│   │   └── intersection.test.ts
│   ├── async/
│   │   └── async-validation.test.ts
│   ├── transformers/
│   │   └── transformers.test.ts
│   ├── errors/
│   │   └── error-handling.test.ts
│   └── adapters/
│       ├── react.test.ts
│       ├── vue.test.ts
│       └── express.test.ts
├── property/
│   ├── core-properties.test.ts
│   ├── error-properties.test.ts
│   ├── async-properties.test.ts
│   ├── transformer-properties.test.ts
│   └── composition-properties.test.ts
└── integration/
    ├── end-to-end.test.ts
    └── framework-integration.test.ts
```

### Testing Tools

- **Test Runner**: Vitest (fast, TypeScript-native, compatible with Jest API)
- **Property Testing**: fast-check (100+ iterations per property)
- **Assertions**: Vitest's built-in expect API
- **Coverage**: Vitest coverage with c8
- **Framework Testing**: @testing-library/react, @testing-library/vue for adapter tests

### Continuous Integration

- All tests run on every commit
- Property tests run with increased iterations (1000+) on main branch
- Coverage target: 95%+ for core engine, 85%+ overall
- Performance benchmarks tracked to prevent regressions
