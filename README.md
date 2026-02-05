# 🚀 Wenfit Validator

> **Universal, type-safe validation for TypeScript/JavaScript**
> Define once, validate everywhere - React, Vue, Angular, Express, NestJS

[![npm version](https://img.shields.io/npm/v/wenfit-validator.svg)](https://www.npmjs.com/package/wenfit-validator)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/wenfit-validator)](https://bundlephobia.com/package/wenfit-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Why Wenfit Validator?

- 🎯 **Type-Safe**: Automatic TypeScript type inference from schemas
- 🌍 **Universal**: One schema works across frontend and backend
- ⚡ **Fast**: Validates simple schemas in < 0.01ms
- 📦 **Tiny**: Core bundle only 7.7KB gzipped
- 🔌 **Framework Ready**: Built-in adapters for React, Vue, Angular, Express
- 🎨 **Developer Friendly**: Fluent API with excellent IntelliSense
- 🧪 **Battle Tested**: 279 tests with property-based testing

## 📦 Installation

```bash
npm install wenfit-validator
# or
yarn add wenfit-validator
# or
pnpm add wenfit-validator
```

## 🚀 Quick Start

```typescript
import { string, number, object, array } from 'wenfit-validator';

// Define your schema
const userSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  age: number().min(18).max(120),
  tags: array(string()).min(1).max(5)
});

// Validate data
const result = userSchema.safeParse({
  name: "John Doe",
  email: "john@example.com",
  age: 25,
  tags: ["developer", "typescript"]
});

if (result.success) {
  console.log("Valid!", result.data);
  // TypeScript knows the exact type!
} else {
  console.log("Errors:", result.errors);
}
```

## 🎯 Core Features

### Type Inference

TypeScript types are automatically inferred from your schemas:

```typescript
import { Infer } from 'wenfit-validator';

const productSchema = object({
  id: string(),
  name: string(),
  price: number().positive(),
  inStock: boolean()
});

// Automatically typed!
type Product = Infer<typeof productSchema>;
// { id: string; name: string; price: number; inStock: boolean }
```

### Primitive Types

```typescript
// String validation
const nameSchema = string()
  .min(2, "Too short")
  .max(50, "Too long")
  .trim()
  .toLowerCase();

const emailSchema = string().email();
const urlSchema = string().url();
const patternSchema = string().pattern(/^[A-Z]{3}-\d{4}$/);

// Number validation
const ageSchema = number()
  .min(0)
  .max(120)
  .int();

const priceSchema = number()
  .positive()
  .finite();

// Boolean & Date
const activeSchema = boolean();
const birthdateSchema = date()
  .min(new Date('1900-01-01'))
  .max(new Date());

// Enum
const statusSchema = enum(['pending', 'active', 'completed']);
```

### Complex Types

```typescript
// Objects
const addressSchema = object({
  street: string(),
  city: string(),
  zipCode: string().pattern(/^\d{5}$/),
  country: string().default('USA')
});

// Arrays
const tagsSchema = array(string())
  .min(1)
  .max

## Core Concepts

### Schema Definition

```typescript
import { string, number, boolean, date, object, array } from 'wenfit-validator';

// Primitives
const name = string().min(1).max(100);
const age = number().int().min(0).max(120);
const active = boolean();
const birthDate = date().max(new Date());

// Objects
const user = object({
  name: string(),
  email: string().email(),
  profile: object({
    bio: string().optional(),
    website: string().url().optional(),
  }),
});

// Arrays
const tags = array(string().min(1)).max(10);
```
).trim(),
  age: string().transform(parseInt),
  tags: array(string()).transform(tags => tags.map(t => t.toUpperCase()))
});

const result = userSchema.parse({
  email: "  JOHN@EXAMPLE.COM  ",
  age: "25",
  tags: ["dev", "ts"]
});

// Result: { email: "john@example.com", age: 25, tags: ["DEV", "TS"] }
```

### Custom Validation

```typescript
const passwordSchema = string()
  .min(8)
  .refine(
    (val) => /[A-Z]/.test(val),
    "Must contain uppercase letter"
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "Must contain number"
  );

// Async validation
const usernameSchema = string()
  .min(3)
  .refine(
    async (username) => {
      const available = await checkUsernameAvailability(username);
      return available;
    },
    "Username already taken"
  );
```

### Optional & Nullable

```typescript
const schema = object({
  name: string(),                    // required
  nickname: string().optional(),     // string | undefined
  middleName: string().nullable(),   // string | null
  suffix: string().optional().nullable(), // string | null | undefined
  age: number().default(0)           // uses default if undefined
});
```

## 🎨 Framework Integration

### React

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { object, string, number } from 'wenfit-validator';

const formSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

function MyForm() {
  const { validate, errors, getFieldError } = useValidator({
    schema: formSchema
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await validate(data);
    if (result.success) {
      console.log("Form valid!", result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {getFieldError('name') && <span>{getFieldError('name').message}</span>}

      <input name="email" type="email" />
      {getFieldError('email') && <span>{getFieldError('email').message}</span>}

      <input name="age" type="number" />
      {getFieldError('age') && <span>{getFieldError('age').message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Vue 3

```vue
<script setup>
import { useValidation } from 'wenfit-validator/adapters/vue';
import { object, string, number } from 'wenfit-validator';

const formSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

const { validate, errors, getFieldError } = useValidation(formSchema);

const formData = reactive({
  name: '',
  email: '',
  age: null
});

const handleSubmit = async () => {
  const result = await validate(formData);
  if (result.success) {
    console.log("Form valid!", result.data);
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.name" />
    <span v-if="getFieldError('name')">{{ getFieldError('name').message }}</span>

    <input v-model="formData.email" type="email" />
    <span v-if="getFieldError('email')">{{ getFieldError('email').message }}</span>

    <input v-model.number="formData.age" type="number" />
    <span v-if="getFieldError('age')">{{ getFieldError('age').message }}</span>

    <button type="submit">Submit</button>
  </form>
</template>
```

### Express/NestJS

```typescript
import express from 'express';
import { validate } from 'wenfit-validator/adapters/express';
import { object, string, number } from 'wenfit-validator';

const app = express();

const createUserSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

app.post('/users',
  validate({ schema: createUserSchema, source: 'body' }),
  (req, res) => {
    // req.body is now validated and typed!
    const user = req.body;
    res.json({ success: true, user });
  }
);

// Validate query params
app.get('/search',
  validate({
    schema: object({ q: string().min(1) }),
    source: 'query'
  }),
  (req, res) => {
    const { q } = req.query;
    res.json({ results: search(q) });
  }
);
```

### Angular

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationService } from 'wenfit-validator/adapters/angular';
import { object, string, number } from 'wenfit-validator';

const formSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

@Component({
  selector: 'app-user-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" />
      <div *ngIf="validationService.getErrorMessage(form.get('name'))">
        {{ validationService.getErrorMessage(form.get('name')) }}
      </div>

      <button type="submit">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public validationService: ValidationService
  ) {
    this.form = this.fb.group({
      name: ['', this.validationService.createValidator(string().min(2))],
      email: ['', this.validationService.createValidator(string().email())],
      age: [null, this.validationService.createValidator(number().min(18))]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

## 🔧 Advanced Features

### Schema Composition

```typescript
// Extend schemas
const baseUserSchema = object({
  id: string(),
  name: string()
});

const adminUserSchema = baseUserSchema.extend({
  role: string(),
  permissions: array(string())
});

// Merge schemas
const timestampSchema = object({
  createdAt: date(),
  updatedAt: date()
});

const userWithTimestamps = baseUserSchema.merge(timestampSchema);

// Pick/Omit
const publicUserSchema = userSchema.pick(['id', 'name']);
const userWithoutPassword = userSchema.omit(['password']);
```

### Error Handling

```typescript
// Structured errors with paths
const result = userSchema.safeParse(invalidData);

if (!result.success) {
  result.errors.forEach(error => {
    console.log(error.path);    // ['profile', 'email']
    console.log(error.message); // "Invalid email format"
    console.log(error.code);    // "string.email"
    console.log(error.meta);    // { constraint: 'email' }
  });
}

// Throw on error
try {
  const data = userSchema.parse(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.format()); // Pretty formatted errors
    console.log(error.flatten()); // { 'profile.email': ['Invalid email'] }
  }
}
```

### Custom Error Messages

```typescript
// Global message templates
import { setErrorMessages } from 'wenfit-validator';

setErrorMessages({
  'string.email': 'Please enter a valid email address',
  'string.min': 'Must be at least {{min}} characters',
  'number.min': 'Must be at least {{min}}'
});

// Per-schema messages
const schema = string()
  .min(8, 'Password must be at least 8 characters')
  .email('Please provide a valid email');
```

### JSON Schema Export

```typescript
const userSchema = object({
  name: string().min(2).max(50),
  age: number().min(0).max(120),
  email: string().email()
});

const jsonSchema = userSchema.toJSONSchema();
// Use with OpenAPI/Swagger documentation
```

### Plugin System

```typescript
import { Plugin } from 'wenfit-validator';

const customPlugin: Plugin = {
  name: 'custom-validation',
  install(validator) {
    // Add custom validation rules globally
    validator.addRule('creditCard', (value) => {
      return /^\d{16}$/.test(value);
    });
  }
};

// Register plugin
validator.use(customPlugin);
```

## 📊 Performance

Wenfit Validator is optimized for speed:

- **Simple schemas**: < 0.01ms per validation
- **Nested objects**: < 0.01ms per validation
- **Large arrays (100 items)**: < 0.1ms per validation
- **Bundle size**: 7.7KB gzipped (core)

## 🆚 Comparison

| Feature | Wenfit | Zod | Yup | Joi |
|---------|--------|-----|-----|-----|
| TypeScript-first | ✅ | ✅ | ❌ | ❌ |
| Bundle size (gzipped) | 7.7KB | 12.4KB | 15.2KB | 146KB |
| Framework adapters | ✅ | ❌ | ❌ | ❌ |
| Async validation | ✅ | ✅ | ✅ | ✅ |
| Transformers | ✅ | ✅ | ✅ | ✅ |
| JSON Schema export | ✅ | ❌ | ❌ | ❌ |
| Plugin system | ✅ | ❌ | ❌ | ✅ |

## 📚 Documentation

- [API Reference](./docs/API.md)
- [React Integration](./docs/integration/react.md)
- [Vue Integration](./docs/integration/vue.md)
- [Angular Integration](./docs/integration/angular.md)
- [Express Integration](./docs/integration/express.md)
- [Examples](./examples/)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT © Wenfit Team

## 🌟 Show Your Support

If you find Wenfit Validator helpful, please give it a ⭐️ on [GitHub](https://github.com/yourusername/wenfit-validator)!

---

Made with ❤️ by the Wenfit Team
