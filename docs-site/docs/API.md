# Wenfit Validator API Reference

Complete API documentation for Wenfit Validator.

## Table of Contents

- [Core Schema Types](#core-schema-types)
- [Primitive Schemas](#primitive-schemas)
- [Complex Schemas](#complex-schemas)
- [Schema Methods](#schema-methods)
- [Validation Methods](#validation-methods)
- [Error Handling](#error-handling)
- [Type Utilities](#type-utilities)
- [Framework Adapters](#framework-adapters)
- [Plugin System](#plugin-system)

## Core Schema Types

### Schema<TInput, TOutput>

Base class for all validation schemas.

```typescript
abstract class Schema<TInput, TOutput = TInput> {
    parse(input: unknown): TOutput;
    safeParse(input: unknown): ValidationResult&lt;TOutput&gt;;

    // Modifiers
    optional(): Schema<TInput | undefined, TOutput | undefined>;
    nullable(): Schema<TInput | null, TOutput | null>;
    default(value: TOutput): Schema<TInput | undefined, TOutput>;

    // Composition
    refine(predicate: (value: TOutput) => boolean | Promise<boolean>, message: string): Schema<TInput, TOutput>;
    transform&lt;U&gt;(fn: (value: TOutput) => U): Schema<TInput, U>;

    // Utility
    toJSONSchema(): JSONSchema;
}
```

### ValidationResult&lt;T&gt;

Result type returned by `safeParse`.

```typescript
type ValidationResult&lt;T&gt; =
    | { success: true; data: T }
    | { success: false; errors: ValidationErrorData[] };
```

## Primitive Schemas

### string()

Creates a string validation schema.

```typescript
function string(): StringSchema;
```

**Methods:**

```typescript
class StringSchema extends Schema<string, string> {
    // Length constraints
    min(length: number, message?: string): StringSchema;
    max(length: number, message?: string): StringSchema;
    length(exact: number, message?: string): StringSchema;

    // Pattern validation
    pattern(regex: RegExp, message?: string): StringSchema;
    email(message?: string): StringSchema;
    url(message?: string): StringSchema;

    // Transformers
    trim(): StringSchema;
    toLowerCase(): StringSchema;
    toUpperCase(): StringSchema;
}
```

**Examples:**

```typescript
// Basic string
const schema = string();

// With constraints
const username = string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Email validation
const email = string().email('Please enter a valid email address');

// URL validation
const website = string().url('Please enter a valid URL');

// With transformers
const normalizedEmail = string()
    .email()
    .transform(val => val.toLowerCase().trim());
```

### number()

Creates a number validation schema.

```typescript
function number(): NumberSchema;
```

**Methods:**

```typescript
class NumberSchema extends Schema<number, number> {
    // Range constraints
    min(value: number, message?: string): NumberSchema;
    max(value: number, message?: string): NumberSchema;

    // Type constraints
    int(message?: string): NumberSchema;
    positive(message?: string): NumberSchema;
    negative(message?: string): NumberSchema;
    finite(message?: string): NumberSchema;
}
```

**Examples:**

```typescript
// Basic number
const schema = number();

// Age validation
const age = number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age');

// Price validation
const price = number()
    .positive('Price must be positive')
    .refine(
        (val) => val === Math.round(val * 100) / 100,
        'Price must have at most 2 decimal places'
    );
```

### boolean()

Creates a boolean validation schema.

```typescript
function boolean(): BooleanSchema;
```

**Examples:**

```typescript
// Basic boolean
const schema = boolean();

// Terms   .max(new Date(), 'Birth date cannot be in the future')
    .min(new Date('1900-01-01'), 'Please enter a valid birth date');
```

### enumSchema()

Creates an enum validation schema.

```typescript
function enumSchema<T extends readonly [string | number, ...(string | number)[]]>(
    values: T
): EnumSchema<T[number]>;
```

**Examples:**

```typescript
// String enum
const role = enumSchema(['user', 'admin', 'moderator']);

// Number enum
const status = enumSchema([0, 1, 2, 3]);

// With default
const roleWithDefault = enumSchema(['user', 'admin', 'moderator']).default('user');
```

## Complex Schemas

### object()

Creates an object validation schema.

```typescript
function object<T extends Record<string, Schema<any>>>(
    shape: T
): ObjectSchema&lt;T&gt;;
```

**Methods:**

```typescript
class ObjectSchema&lt;T&gt; extends Schema {
    // Strict mode
    strict(): ObjectSchema&lt;T&gt;;
    passthrough(): ObjectSchema&lt;T&gt;;

    // Composition
    extend&lt;U&gt;(extension: U): ObjectSchema<T & U>;
    merge&lt;U&gt;(other: ObjectSchema&lt;U&gt;): ObjectSchema<T & U>;
    pick&lt;K extends keyof T>(keys: K[]): ObjectSchema&lt;Pick<T, K>>;
    omit&lt;K extends keyof T>(keys: K[]): ObjectSchema&lt;Omit<T, K>>;
}
```

**Examples:**

```typescript
// Basic object
const userSchema = object({
    id: string(),
    username: string().min(3),
    email: string().email(),
    age: number().int().min(18),
});

// Nested object
const profileSchema = object({
    user: object({
        firstName: string(),
        lastName: string(),
    }),
    address: object({
        street: string(),
        city: string(),
        zipCode: string().pattern(/^\d{5}$/),
    }),
});

// Strict mode (reject unknown properties)
const strictSchema = object({
    name: string(),
    email: string().email(),
}).strict();

// Schema composition
const baseSchema = object({
    id: string(),
    createdAt: date(),
});

const userSchema = baseSchema.extend({
    username: string(),
    email: string().email(),
});

// Pick specific properties
const publicUserSchema = userSchema.pick(['id', 'username']);

// Omit specific properties
const userWithoutPassword = userSchema.omit(['password']);
```

### array()

Creates an array validation schema.

```typescript
function array<T extends Schema<any>>(
    element: T
): ArraySchema&lt;T&gt;;
```

**Methods:**

```typescript
class ArraySchema&lt;T&gt; extends Schema {
    min(length: number, message?: string): ArraySchema&lt;T&gt;;
    max(length: number, message?: string): ArraySchema&lt;T&gt;;
    length(exact: number, message?: string): ArraySchema&lt;T&gt;;
    nonempty(message?: string): ArraySchema&lt;T&gt;;
}
```

**Examples:**

```typescript
// Array of strings
const tags = array(string());

// Array with constraints
const limitedTags = array(string().min(1))
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed');

// Array of objects
const users = array(object({
    id: string(),
    name: string(),
}));

// Nested arrays
const matrix = array(array(number()));
```

### union()

Creates a union validation schema (OR logic).

```typescript
function union<T extends readonly [Schema<any>, ...Schema<any>[]]>(
    schemas: T
): UnionSchema&lt;T&gt;;
```

**Examples:**

```typescript
// String or number
const stringOrNumber = union([string(), number()]);

// Multiple object types
const eventSchema = union([
    object({
        type: enumSchema(['click']),
        elementId: string(),
    }),
    object({
        type: enumSchema(['pageview']),
        url: string().url(),
    }),
]);
```

### intersection()

Creates an intersection validation schema (AND logic).

```typescript
function intersection<T extends readonly [Schema<any>, ...Schema<any>[]]>(
    schemas: T
): IntersectionSchema&lt;T&gt;;
```

**Examples:**

```typescript
// Combine multiple schemas
const baseSchema = object({
    id: string(),
    timestamp: date(),
});

const userEventSchema = intersection([
    baseSchema,
    object({
        userId: string(),
        action: string(),
    }),
]);
```

## Schema Methods

### optional()

Makes a schema accept `undefined` values.

```typescript
schema.optional(): Schema<TInput | undefined, TOutput | undefined>
```

**Example:**

```typescript
const optionalEmail = string().email().optional();

optionalEmail.parse(undefined); // ✓ Valid
optionalEmail.parse('test@example.com'); // ✓ Valid
optionalEmail.parse('invalid'); // ✗ Invalid
```

### nullable()

Makes a schema accept `null` values.

```typescript
schema.nullable(): Schema<TInput | null, TOutput | null>
```

**Example:**

```typescript
const nullableDate = date().nullable();

nullableDate.parse(null); // ✓ Valid
nullableDate.parse(new Date()); // ✓ Valid
```

### default()

Provides a default value when input is `undefined`.

```typescript
schema.default(value: TOutput): Schema<TInput | undefined, TOutput>
```

**Example:**

```typescript
const roleWithDefault = enumSchema(['user', 'admin']).default('user');

roleWithDefault.parse(undefined); // Returns 'user'
roleWithDefault.parse('admin'); // Returns 'admin'
```

### refine()

Adds custom validation logic.

```typescript
schema.refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message: string | ErrorOptions
): Schema<TInput, TOutput>
```

**Examples:**

```typescript
// Synchronous validation
const strongPassword = string()
    .min(8)
    .refine(
        (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
        'Password must contain uppercase, lowercase, and number'
    );

// Asynchronous validation
const uniqueUsername = string()
    .min(3)
    .refine(
        async (val) => {
            const isAvailable = await checkUsernameAvailable(val);
            return isAvailable;
        },
        'Username is already taken'
    );

// Multiple refine rules
const complexValidation = number()
    .min(0)
    .refine((val) => val % 2 === 0, 'Must be even')
    .refine((val) => val < 100, 'Must be less than 100');
```

### transform()

Transforms validated data.

```typescript
schema.transform&lt;U&gt;(fn: (value: TOutput) => U): Schema<TInput, U>
```

**Examples:**

```typescript
// String transformation
const normalizedEmail = string()
    .email()
    .transform(val => val.toLowerCase().trim());

// Array transformation
const lowercaseTags = array(string())
    .transform(tags => tags.map(t => t.toLowerCase()));

// Object transformation
const userWithFullName = object({
    firstName: string(),
    lastName: string(),
}).transform(data => ({
    ...data,
    fullName: `${data.firstName} ${data.lastName}`,
}));
```

## Validation Methods

### parse()

Validates input and returns the result. Throws `ValidationError` on failure.

```typescript
schema.parse(input: unknown): TOutput
```

**Example:**

```typescript
const schema = string().email();

try {
    const email = schema.parse('test@example.com');
    console.log('Valid email:', email);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Validation failed:', error.errors);
    }
}
```

### safeParse()

Validates input and returns a result object. Never throws.

```typescript
schema.safeParse(input: unknown): ValidationResult&lt;TOutput&gt;
```

**Example:**

```typescript
const schema = string().email();

const result = schema.safeParse('test@example.com');

if (result.success) {
    console.log('Valid email:', result.data);
} else {
    console.error('Validation errors:', result.errors);
}
```

## Error Handling

### ValidationError

Error class thrown by `parse()` method.

```typescript
class ValidationError extends Error {
    errors: ValidationErrorData[];

    format(): string;
    flatten(): Record<string, string[]>;
}
```

**Example:**

```typescript
try {
    schema.parse(invalidData);
} catch (error) {
    if (error instanceof ValidationError) {
        // Get formatted error message
        console.log(error.format());

        // Get flattened errors by path
        const flatErrors = error.flatten();
        console.log(flatErrors);
        // { 'email': ['Invalid email'], 'age': ['Must be at least 18'] }
    }
}
```

### ValidationErrorData

Structure of individual validation errors.

```typescript
interface ValidationErrorData {
    path: (string | number)[];
    message: string;
    code: string;
    meta?: Record<string, any>;
}
```

**Example:**

```typescript
const result = schema.safeParse(invalidData);

if (!result.success) {
    result.errors.forEach(error => {
        console.log('Path:', error.path.join('.'));
        console.log('Message:', error.message);
        console.log('Code:', error.code);
        console.log('Meta:', error.meta);
    });
}
```

### Error Codes

Standardized error codes for all validation failures.

```typescript
const ErrorCodes = {
    INVALID_TYPE: 'invalid_type',
    STRING_MIN: 'string.min',
    STRING_MAX: 'string.max',
    STRING_EMAIL: 'string.email',
    STRING_URL: 'string.url',
    NUMBER_MIN: 'number.min',
    NUMBER_MAX: 'number.max',
    ARRAY_MIN: 'array.min',
    ARRAY_MAX: 'array.max',
    REQUIRED: 'required',
    CUSTOM: 'custom',
    // ... more codes
} as const;
```

### Custom Error Messages

Customize error messages globally or per-schema.

```typescript
// Global customization
import { setErrorMessages } from 'wenfit-validator';

setErrorMessages({
    'string.email': 'Please enter a valid email address',
    'string.min': 'Must be at least {{min}} characters',
    'number.min': 'Must be at least {{min}}',
});

// Per-schema customization
const schema = string()
    .min(3, 'Username must be at least 3 characters')
    .email('Invalid email format');
```

## Type Utilities

### Infer&lt;T&gt;

Extracts the output type from a schema.

```typescript
type Infer<T extends Schema<any, any>> = T extends Schema<any, infer O> ? O : never;
```

**Example:**

```typescript
const userSchema = object({
    id: string(),
    username: string(),
    email: string().email(),
    age: number().int(),
});

type User = Infer<typeof userSchema>;
// type User = {
//     id: string;
//     username: string;
//     email: string;
//     age: number;
// }
```

### InferInput&lt;T&gt;

Extracts the input type from a schema.

```typescript
type InferInput<T extends Schema<any, any>> = T extends Schema<infer I, any> ? I : never;
```

### Optional&lt;T&gt;

Makes all properties optional.

```typescript
type Optional&lt;T&gt; = { [K in keyof T]?: T[K] };
```

### Nullable&lt;T&gt;

Makes all properties nullable.

```typescript
type Nullable&lt;T&gt; = { [K in keyof T]: T[K] | null };
```

## Framework Adapters

### React Adapter

Hook for form validation in React.

```typescript
import { useValidator } from 'wenfit-validator/adapters/react';

interface UseValidatorOptions&lt;T&gt; {
    schema: Schema<any, T>;
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
}

interface UseValidatorReturn&lt;T&gt; {
    validate: (data: unknown) => Promise<ValidationResult&lt;T&gt;>;
    errors: Ref<ValidationErrorData[]>;
    isValidating: Ref<boolean>;
    getFieldError: (path: string) => ValidationErrorData | undefined;
    clearErrors: () => void;
}

function useValidator&lt;T&gt;(options: UseValidatorOptions&lt;T&gt;): UseValidatorReturn&lt;T&gt;;
```

**Example:**

```typescript
function MyForm() {
    const { validate, errors, getFieldError } = useValidator({
        schema: mySchema,
        mode: 'onChange',
    });

    const handleSubmit = async (data) => {
        const result = await validate(data);
        if (result.success) {
            // Handle success
        }
    };

    return (
        <form>
            <input />
            {getFieldError('email') && (
                <span>{getFieldError('email')?.message}</span>
            )}
        </form>
    );
}
```

### Vue Adapter

Composable for form validation in Vue.

```typescript
import { useValidation } from 'wenfit-validator/adapters/vue';

interface UseValidationReturn&lt;T&gt; {
    validate: (data: unknown) => Promise<ValidationResult&lt;T&gt;>;
    errors: Ref<ValidationErrorData[]>;
    isValidating: Ref<boolean>;
    getFieldError: (path: string) => ValidationErrorData | undefined;
    clearErrors: () => void;
}

function useValidation&lt;T&gt;(schema: Schema<any, T>): UseValidationReturn&lt;T&gt;;
```

### Express Adapter

Middleware for request validation in Express.

```typescript
import { validate } from 'wenfit-validator/adapters/express';

interface ValidateOptions {
    schema: Schema<any, any>;
    source?: 'body' | 'query' | 'params';
    onError?: (errors: ValidationErrorData[], req: Request, res: Response) => void;
}

function validate(options: ValidateOptions): RequestHandler;
```

**Example:**

```typescript
app.post(
    '/api/users',
    validate({ schema: createUserSchema, source: 'body' }),
    (req, res) => {
        const userData = req.validatedData;
        // userData is fully validated and typed
    }
);
```

### Angular Adapter

Service and validators for Angular forms.

```typescript
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';

class ValidationService {
    validate&lt;T&gt;(schema: Schema<any, T>, data: unknown): ValidationResult&lt;T&gt;;
}

function createSchemaValidator(schema: Schema<any, any>): ValidatorFn;
```

## Plugin System

### Plugin Interface

```typescript
interface Plugin {
    name: string;
    install(validator: ValidatorInstance): void;
}

interface ValidatorInstance {
    addGlobalRule(rule: GlobalValidationRule): void;
}
```

### Registering Plugins

```typescript
import { pluginRegistry } from 'wenfit-validator';

const myPlugin: Plugin = {
    name: 'my-plugin',
    install(validator) {
        validator.addGlobalRule({
            validate: (value, ctx) => {
                // Custom validation logic
            },
        });
    },
};

pluginRegistry.register(myPlugin);
```

## JSON Schema Export

Convert schemas to JSON Schema format.

```typescript
schema.toJSONSchema(): JSONSchema
```

**Example:**

```typescript
const schema = object({
    name: string().min(1).max(100),
    age: number().int().min(0).max(120),
    email: string().email(),
});

const jsonSchema = schema.toJSONSchema();
// {
//     type: 'object',
//     properties: {
//         name: { type: 'string', minLength: 1, maxLength: 100 },
//         age: { type: 'integer', minimum: 0, maximum: 120 },
//         email: { type: 'string', format: 'email' }
//     },
//     required: ['name', 'age', 'email']
// }
```
