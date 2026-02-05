# Error Handling

Wenfit Validator provides structured, detailed error information to help you provide meaningful feedback to users.

## Error Structure

When validation fails, you receive an array of error objects:

```typescript
interface ValidationErrorData {
  path: (string | number)[];  // Location of the error
  message: string;             // Human-readable message
  code: string;                // Error code (e.g., 'string.email')
  meta?: Record<string, any>;  // Additional context
}
```

## Accessing Errors

### With safeParse()

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  result.errors.forEach(error => {
    console.log('Field:', error.path.join('.'));
    console.log('Message:', error.message);
    console.log('Code:', error.code);
  });
}
```

### With parse()

```typescript
import { ValidationError } from 'wenfit-validator';

try {
  const data = schema.parse(input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Errors:', error.errors);

    // Formatted string
    console.log(error.format());

    // Flattened by path
    const flat = error.flatten();
    // { 'email': ['Invalid email'], 'age': ['Must be at least 18'] }
  }
}
```

## Error Paths

Errors include the path to the invalid field, making it easy to display field-specific errors:

```typescript
const userSchema = object({
  profile: object({
    email: string().email(),
    address: object({
      zipCode: string().pattern(/^\d{5}$/),
    }),
  }),
});

const result = userSchema.safeParse({
  profile: {
    email: 'invalid',
    address: {
      zipCode: 'abc',
    },
  },
});

if (!result.success) {
  result.errors.forEach(error => {
    console.log(error.path);
    // ['profile', 'email']
    // ['profile', 'address', 'zipCode']
  });
}
```

## Error Codes

All validation errors have standardized error codes:

```typescript
import { ErrorCodes } from 'wenfit-validator';

// Type errors
ErrorCodes.INVALID_TYPE        // 'invalid_type'

// String errors
ErrorCodes.STRING_MIN          // 'string.min'
ErrorCodes.STRING_MAX          // 'string.max'
ErrorCodes.STRING_EMAIL        // 'string.email'
ErrorCodes.STRING_URL          // 'string.url'
ErrorCodes.STRING_PATTERN      // 'string.pattern'

// Number errors
ErrorCodes.NUMBER_MIN          // 'number.min'
ErrorCodes.NUMBER_MAX          // 'number.max'
ErrorCodes.NUMBER_INT          // 'number.int'

// Array errors
ErrorCodes.ARRAY_MIN           // 'array.min'
ErrorCodes.ARRAY_MAX           // 'array.max'

// Object errors
ErrorCodes.REQUIRED            // 'required'
ErrorCodes.UNKNOWN_KEYS        // 'unknown_keys'

// Custom errors
ErrorCodes.CUSTOM              // 'custom'
```

Use error codes for conditional logic or translations:

```typescript
if (!result.success) {
  const emailError = result.errors.find(e =>
    e.path[0] === 'email' && e.code === ErrorCodes.STRING_EMAIL
  );

  if (emailError) {
    console.log('Invalid email format');
  }
}
```

## Custom Error Messages

### Per-Schema Messages

Customize messages when defining constraints:

```typescript
const schema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters'),

  email: string()
    .email('Please enter a valid email address'),

  age: number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old'),
});
```

### Global Message Templates

Set default meat least {{min}} characters',
  'string.max': 'Cannot exceed {{max}} characters',
  'array.min': 'Must have at least {{min}} items',
});
```

### Internationalization

Use error codes for i18n:

```typescript
const translations = {
  en: {
    'string.email': 'Please enter a valid email address',
    'string.min': 'Must be at least {{min}} characters',
  },
  es: {
    'string.email': 'Por favor ingrese un correo electrónico válido',
    'string.min': 'Debe tener al menos {{min}} caracteres',
  },
};

function translateError(error: ValidationErrorData, locale: string) {
  const template = translations[locale][error.code];
  if (!template) return error.message;

  // Replace placeholders
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    error.meta?.[key] ?? ''
  );
}
```

## Error Metadata

Errors include relevant metadata for context:

```typescript
const schema = string().min(5).max(10);
const result = schema.safeParse('abc');

if (!result.success) {
  const error = result.errors[0];
  console.log(error.code);    // 'string.min'
  console.log(error.meta);    // { min: 5, actual: 3 }
}
```

Common metadata fields:

- **min/max**: Constraint values for range errors
- **actual**: Actual value that failed validation
- **expected**: Expected type or format
- **pattern**: Regex pattern for pattern errors
- **allowed**: Allowed values for enum errors

## Displaying Errors in Forms

### Field-Level Errors

```typescript
function getFieldError(errors: ValidationErrorData[], fieldPath: string) {
  return errors.find(e => e.path.join('.') === fieldPath);
}

const emailError = getFieldError(result.errors, 'email');
if (emailError) {
  console.log(emailError.message);
}
```

### Error Summary

```typescript
function ErrorSummary({ errors }: { errors: ValidationErrorData[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="error-summary">
      <h4>Please fix the following errors:</h4>
      <ul>
        {errors.map((error, i) => (
          <li key={i}>
            <strong>{error.path.join('.')}</strong>: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Handling Async Errors

Async validation errors are handled the same way:

```typescript
const schema = object({
  username: string().refine(
    async (val) => await checkAvailable(val),
    'Username is already taken'
  ),
});

const result = await schema.safeParse(data);

if (!result.success) {
  // Handle errors normally
  console.log(result.errors);
}
```

## Next Steps

- [React Integration](../integration/react.md) - Display errors in React forms
- [Custom Validation](./custom-validation.md) - Create custom validation rules
- [API Reference](../api/errors.md) - Complete error API
