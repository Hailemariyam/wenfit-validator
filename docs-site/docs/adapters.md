# Framework Adapters

Wenfit Validator provides adapters for popular frontend and backend frameworks, making it easy to integrate validation into your applications.

## Table of Contents

- [React Adapter](#react-adapter)
- [Vue Adapter](#vue-adapter)
- [Angular Adapter](#angular-adapter)
- [Express/NestJS Adapter](#expressnestjs-adapter)

## React Adapter

The React adapter provides a `useValidator` hook for form validation with reactive state management.

### Installation

```bash
npm install wenfit-validator react
```

### Basic Usage

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
    email: string().email(),
    password: string().min(8),
});

function LoginForm() {
    const { validate, errors, getFieldError, clearErrors } = useValidator({
        schema: loginSchema,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        const result = await validate(data);

        if (result.success) {
            console.log('Login successful:', result.data);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="email" type="email" />
            {getFieldError('email') && (
                <span className="error">{getFieldError('email')?.message}</span>
            )}

            <input name="password" type="password" />
            {getFieldError('password') && (
                <span className="error">{getFieldError('password')?.message}</span>
            )}

            <button type="submit">Login</button>
        </form>
    );
}
```

### API Reference

#### useValidator(options)

**Parameters:**
- `options.schema`: The validation schema
- `options.mode`: Validation mode (`'onChange'` | `'onBlur'` | `'onSubmit'`)

**Returns:**
- `validate(data)`: Function to validate data
- `errors`: Reactive ref containing all validation errors
- `isValidating;
```

### Async Validation

```tsx
const asyncSchema = object({
    username: string().refine(
        async (val) => {
            const isAvailable = await checkUsernameAvailable(val);
            return isAvailable;
        },
        'Username is already taken'
    ),
});

function RegistrationForm() {
    const { validate, isValidating } = useValidator({ schema: asyncSchema });

    return (
        <form>
            <input name="username" />
            {isValidating.value && <span>Checking availability...</span>}
            <button type="submit" disabled={isValidating.value}>
                Register
            </button>
        </form>
    );
}
```

## Vue Adapter

The Vue adapter provides a `useValidation` composable for form validation with reactive state.

### Installation

```bash
npm install wenfit-validator vue
```

### Basic Usage

```vue
<script setup>
import { ref } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
    email: string().email(),
    password: string().min(8),
});

const { validate, errors, getFieldError, clearErrors } = useValidation(loginSchema);

const formData = ref({
    email: '',
    password: '',
});

const handleSubmit = async () => {
    const result = await validate(formData.value);

    if (result.success) {
        console.log('Login successful:', result.data);
    }
};
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <div>
            <input v-model="formData.email" type="email" />
            <span v-if="getFieldError('email')" class="error">
                {{ getFieldError('email')?.message }}
            </span>
        </div>

        <div>
            <input v-model="formData.password" type="password" />
            <span v-if="getFieldError('password')" class="error">
                {{ getFieldError('password')?.message }}
            </span>
        </div>

        <button type="submit">Login</button>
    </form>
</template>
```

### API Reference

#### useValidation(schema)

**Parameters:**
- `schema`: The validation schema

**Returns:**
- `validate(data)`: Function to validate data
- `errors`: Reactive ref containing all validation errors
- `isValidating`: Reactive ref indicating validation state
- `getFieldError(path)`: Get error for a specific field
- `clearErrors()`: Clear all validation errors

### Real-Time Validation

```vue
<script setup>
import { watch } from 'vue';

const { validate, errors } = useValidation(mySchema);

// Validate on every change
watch(formData, async (newData) => {
    await validate(newData);
}, { deep: true });
</script>
```

## Angular Adapter

The Angular adapter provides a `ValidationService` and validator functions for Angular forms.

### Installation

```bash
npm install wenfit-validator @angular/core @angular/forms
```

### Basic Usage with Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
    email: string().email(),
    password: string().min(8),
});

@Component({
    selector: 'app-login',
    template: `
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <input formControlName="email" type="email" />
            <div *ngIf="loginForm.get('email')?.errors?.['validationErrors']">
                {{ loginForm.get('email')?.errors?.['validationErrors'][0].message }}
            </div>

            <input formControlName="password" type="password" />
            <div *ngIf="loginForm.get('password')?.errors?.['validationErrors']">
                {{ loginForm.get('password')?.errors?.['validationErrors'][0].message }}
            </div>

            <button type="submit">Login</button>
        </form>
    `,
})
export class LoginComponent {
    loginForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private validationService: ValidationService
    ) {
        this.loginForm = this.fb.group({
            email: ['', createSchemaValidator(string().email())],
            password: ['', createSchemaValidator(string().min(8))],
        });
    }

    onSubmit() {
        const result = this.validationService.validate(
            loginSchema,
            this.loginForm.value
        );

        if (result.success) {
            console.log('Login successful:', result.data);
        }
    }
}
```

### API Reference

#### ValidationService

```typescript
class ValidationService {
    validate<T>(schema: Schema<any, T>, data: unknown): ValidationResult<T>;
}
```

#### createSchemaValidator(schema)

Creates an Angular validator function from a schema.

```typescript
function createSchemaValidator(schema: Schema<any, any>): ValidatorFn;
```

**Returns:** Angular `ValidatorFn` that returns:
- `null` if validation succeeds
- `{ validationErrors: ValidationErrorData[] }` if validation fails

### Async Validators

```typescript
const asyncSchema = object({
    username: string().refine(
        async (val) => await checkUsernameAvailable(val),
        'Username is already taken'
    ),
});

this.registrationForm = this.fb.group({
    username: ['', [], [createSchemaValidator(asyncSchema)]],
});
```

## Express/NestJS Adapter

The Express adapter provides middleware for request validation.

### Installation

```bash
npm install wenfit-validator express
```

### Basic Usage

```typescript
import express from 'express';
import { validate } from 'wenfit-validator/adapters/express';
import { string, object } from 'wenfit-validator';

const app = express();
app.use(express.json());

const createUserSchema = object({
    username: string().min(3),
    email: string().email(),
    password: string().min(8),
});

app.post(
    '/api/users',
    validate({ schema: createUserSchema, source: 'body' }),
    (req, res) => {
        // req.validatedData contains validated and typed data
        const userData = req.validatedData;

        res.status(201).json({
            success: true,
            data: userData,
        });
    }
);
```

### API Reference

#### validate(options)

**Parameters:**
- `options.schema`: The validation schema
- `options.source`: Where to get data from (`'body'` | `'query'` | `'params'`)
- `options.onError`: Custom error handler (optional)

**Behavior:**
- On success: Calls `next()` and attaches validated data to `req.validatedData`
- On failure: Returns 400 status with validation errors

### Validating Different Sources

```typescript
// Validate request body
app.post(
    '/api/users',
    validate({ schema: createUserSchema, source: 'body' }),
    handler
);

// Validate query parameters
app.get(
    '/api/users',
    validate({ schema: querySchema, source: 'query' }),
    handler
);

// Validate route parameters
app.get(
    '/api/users/:id',
    validate({ schema: paramsSchema, source: 'params' }),
    handler
);
```

### Custom Error Handling

```typescript
app.post(
    '/api/users',
    validate({
        schema: createUserSchema,
        source: 'body',
        onError: (errors, req, res) => {
            res.status(422).json({
                success: false,
                message: 'Validation failed',
                errors: errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
        },
    }),
    handler
);
```

### Async Validation

```typescript
const createProductSchema = object({
    sku: string().refine(
        async (val) => await checkSkuUnique(val),
        'SKU already exists'
    ),
    name: string().min(1),
    price: number().positive(),
});

app.post(
    '/api/products',
    validate({ schema: createProductSchema, source: 'body' }),
    (req, res) => {
        // Async validation is automatically handled
        const productData = req.validatedData;
        res.status(201).json({ data: productData });
    }
);
```

### NestJS Usage

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { validate } from 'wenfit-validator/adapters/express';

@Controller('users')
export class UsersController {
    @Post()
    async create(@Body() body: any) {
        const result = createUserSchema.safeParse(body);

        if (!result.success) {
            throw new BadRequestException(result.errors);
        }

        return this.usersService.create(result.data);
    }
}
```

## Cross-Framework Schema Sharing

One of the key benefits of Wenfit Validator is the ability to share schemas across frameworks.

### Shared Schema Module

```typescript
// shared/schemas.ts
import { string, object, type Infer } from 'wenfit-validator';

export const userSchema = object({
    id: string(),
    username: string().min(3).max(20),
    email: string().email(),
    createdAt: string(), // ISO date string
});

export type User = Infer<typeof userSchema>;
```

### Frontend (React)

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { userSchema } from '../shared/schemas';

function UserForm() {
    const { validate } = useValidator({ schema: userSchema });
    // ...
}
```

### Backend (Express)

```typescript
import { validate } from 'wenfit-validator/adapters/express';
import { userSchema } from '../shared/schemas';

app.post('/api/users', validate({ schema: userSchema }), handler);
```

## Best Practices

1. **Define schemas once**: Create a shared module for schemas used across frontend and backend.

2. **Use TypeScript type inference**: Let the validator generate types with `Infer<typeof schema>`.

3. **Validate at boundaries**: Always validate data when it enters your system (API requests, form submissions).

4. **Provide clear error messages**: Customize error messages to be user-friendly.

5. **Handle async validation carefully**: Use async validation only when necessary (e.g., checking uniqueness).

6. **Test your schemas**: Write tests for your validation schemas to ensure they work as expected.

7. **Use appropriate validation modes**: Choose the right validation mode for your use case (onChange, onBlur, onSubmit).

8. **Validate responses**: Don't just validate requests - validate API responses too for type safety.
