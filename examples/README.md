# Wenfit Validator Examples

This directory contains practical examples demonstrating how to use Wenfit Validator in various scenarios.

## Examples

### 1. React Form Validation (`react-form-validation.tsx`)

A complete React registration form with real-time validation feedback.

**Features:**
- Real-time field validation
- Custom error messages
- Field-level error display
- Form submission handling
- TypeScript type inference

**Key Concepts:**
- Using `useValidator` hook
- Handling validation errors
- Field-level error access with `getFieldError`
- Async validation state management

**Usage:**
```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, object } from 'wenfit-validator';

const schema = object({
    email: string().email(),
    password: string().min(8),
});

function MyForm() {
    const { validate, errors, getFieldError } = useValidator({ schema });
    // ... form implementation
}
```

### 2. Vue Form Validation (`vue-form-validation.vue`)

A complete Vue registration form using Composition API with reactive validation.

**Features:**
- Real-time field validation
- Custom error messages
- Field-level error display
- Form submission handling
- TypeScript type inference

**Key Concepts:**
- Using `useValidator` hook
- Handling validation errors
- Field-level error access with `getFieldError`
- Async validation state management

**Usage:**
```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, object } from 'wenfit-validator';

const schema = object({
    email: string().email(),
    password: string().min(8),
});

function MyForm() {
    const { validate, errors, getFieldError } = useValidator({ schema });
    // ... form implementation
}
```

### 2. Vue Form Validation (`vue-form-validation.vue`)

A complete Vue registration form using Composition API with reactive validation.

**Features:**
- Reactive validation state
- Real-time error feedback
- Composition API patterns
- TypeScript support
- Async validation handling

**Key Concepts:**
- Using `useValidation` composable
- Reactive refs for errors and validation state
- Field-level error display
- Form submission with validation

**Usage:**
```vue
<script setup>
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, object } from 'wenfit-validator';

const schema = object({
    email: string().email(),
    password: string().min(8),
});

const { validate, getFieldError } = useValidation(schema);
</script>
```

### 3. Angular Form Validation (`angular-form-validation.ts`)

A complete Angular registration form using Reactive Forms with validators.

**Features:**
- Reactive Forms integration
- Custom validators from schemas
- Field-level error display
- Form validation service
- TypeScript type safety

**Key Concepts:**
- Using `ValidationService`
- Creating validators with `createSchemaValidator`
- Integrating with Angular forms
- Error display in templates

**Usage:**
```typescript
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';

constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
        email: ['', createSchemaValidator(string().email())],
        password: ['', createSchemaValidator(string().min(8))],
    });
}
```

### 4. Express API Validation (`express-api-validation.ts`)

A complete Express API server with request validation middleware.

### 4. Express API Validation (`express-api-validation.ts`)

A complete Express API server with request validation middleware.

**Features:**
- Request body validation
- Query parameter validation
- Route parameter validation
- Async validation (e.g., checking unique constraints)
- Data transformation
- Error handling

**Key Concepts:**
- Using `validate` middleware
- Validating different request sources (body, query, params)
- Accessing validated data via `req.validatedData`
- Automatic 400 error responses for invalid requests

**Usage:**
```typescript
import { validate } from 'wenfit-validator/adapters/express';
import { string, object } from 'wenfit-validator';

const schema = object({
    username: string().min(3),
    email: string().email(),
});

app.post(
    '/api/users',
    validate({ schema, source: 'body' }),
    (req, res) => {
        const userData = req.validatedData;
        // userData is fully validated and typed
    }
);
```

### 5. Shared Schema Usage (`shared-schema-usage.ts`)

Demonstrates the "define once, validate everywhere" principle by sharing schemas between frontend and backend.

**Features:**
- Shared schema definitions
- Type-safe API client
- Frontend and backend validation
- Request and response validation
- Consistent data structures

**Key Concepts:**
- Defining schemas in a shared module
- Using the same schema on frontend (React) and backend (Express)
- Type inference for API requests and responses
- Building type-safe API clients

**Usage:**
```typescript
// shared/schemas.ts
export const userSchema = object({
    id: string(),
    username: string().min(3),
    email: string().email(),
});

export type User = Infer<typeof userSchema>;

// Backend (Express)
app.post('/api/users', validate({ schema: userSchema }), ...);

// Frontend (React)
const { validate } = useValidator({ schema: userSchema });
```

## Running the Examples

### React Example

1. Install dependencies:
```bash
npm install wenfit-validator react react-dom
```

2. Import and use the component:
```tsx
import { RegistrationForm } from './examples/react-form-validation';

function App() {
    return <RegistrationForm />;
}
```

### Express Example

1. Install dependencies:
```bash
npm install wenfit-validator express
npm install -D @types/express
```

2. Run the server:
```bash
ts-node examples/express-api-validation.ts
```

3. Test the API:
```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

### Shared Schema Example

1. Set up a monorepo or shared package:
```
project/
├── shared/
│   └── schemas.ts
├── backend/
│   └── server.ts
└── frontend/
    └── app.tsx
```

2. Import schemas in both frontend and backend:
```typescript
import { userSchema, createUserRequestSchema } from '../shared/schemas';
```

## Common Patterns

### Pattern 1: Form Validation with Real-Time Feedback

```tsx
const { validate, errors, getFieldError } = useValidator({
    schema: mySchema,
    mode: 'onChange', // Validate on every change
});

// Display field-specific errors
{getFieldError('email') && (
    <span className="error">{getFieldError('email')?.message}</span>
)}
```

### Pattern 2: API Request Validation

```typescript
app.post(
    '/api/resource',
    validate({ schema: requestSchema, source: 'body' }),
    async (req, res) => {
        // req.validatedData is fully validated
        const data = req.validatedData;
        // ... handle request
    }
);
```

### Pattern 3: Async Validation

```typescript
const schema = object({
    username: string().refine(
        async (val) => {
            const isAvailable = await checkUsernameAvailable(val);
            return isAvailable;
        },
        'Username is already taken'
    ),
});
```

### Pattern 4: Data Transformation

```typescript
const schema = object({
    email: string().email().transform(val => val.toLowerCase()),
    tags: array(string()).transform(tags => tags.map(t => t.trim())),
});
```

### Pattern 5: Schema Composition

```typescript
const baseSchema = object({
    id: string(),
    createdAt: date(),
});

const userSchema = baseSchema.extend({
    username: string(),
    email: string().email(),
});
```

### Pattern 6: Type-Safe API Client

```typescript
class ApiClient {
    async createUser(data: CreateUserRequest): Promise<User> {
        // Validate request
        const validatedData = createUserRequestSchema.parse(data);

        const response = await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(validatedData),
        });

        const result = await response.json();

        // Validate response
        return userSchema.parse(result.data);
    }
}
```

## Best Practices

1. **Define schemas once, use everywhere**: Share schemas between frontend and backend for consistency.

2. **Validate at boundaries**: Validate data when it enters your system (API requests, form submissions).

3. **Use TypeScript type inference**: Let the validator generate types for you with `Infer<typeof schema>`.

4. **Provide clear error messages**: Customize error messages to be user-friendly.

5. **Transform data consistently**: Use transformers to normalize data (trim strings, lowercase emails, etc.).

6. **Validate responses**: Don't just validate requests - validate API responses too for type safety.

7. **Use async validation sparingly**: Only use async validation when necessary (e.g., checking uniqueness).

8. **Compose schemas**: Build complex schemas from simpler, reusable pieces.

## Additional Resources

- [Main Documentation](../README.md)
- [API Reference](../docs/api.md)
- [Framework Adapters](../docs/adapters.md)
- [Testing Guide](../docs/testing.md)
