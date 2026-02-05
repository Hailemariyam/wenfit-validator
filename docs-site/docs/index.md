---
layout: home

hero:
  name: Wenfit Validator
  text: Universal Validation Library
  tagline: Type-safe, framework-agnostic validation for TypeScript/JavaScript
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/yourusername/wenfit-validator

features:
  - icon: 🎯
    title: Type-Safe
    details: Full TypeScript support with automatic type inference from schemas

  - icon: 🔌
    title: Framework Adapters
    details: Built-in adapters for React, Vue, Angular, and Express

  - icon: ⚡
    title: Lightweight
    details: Zero dependencies, tree-shakeable, and optimized for performance

  - icon: 🛠️
    title: Extensible
    details: Plugin system for custom validation rules and transformers

  - icon: 🌐
    title: Universal
    details: Works in Node.js, browsers, and edge runtimes

  - icon: 📦
    title: Schema Sharing
    details: Define schemas once, use them across frontend and backend
---

## Quick Start

Install the package:

```bash
npm install wenfit-validator
```

Define a schema and validate data:

```typescript
import { string, number, object } from 'wenfit-validator';

const userSchema = object({
  username: string().min(3).max(20),
  email: string().email(),
  age: number().int().min(18)
});

const result = userSchema.safeParse({
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

## Framework Integration

### React

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';

function MyForm() {
  const { validate, errors, getFieldError } = useValidator({
    schema: userSchema
  });

  // Use in your form...
}
```

### Vue

```vue
<script setup>
import { useValidation } from 'wenfit-validator/adapters/vue';

const { validate, errors, getFieldError } = useValidation({
  schema: userSchema
});
</script>
```

### Express

```typescript
import { validate } from 'wenfit-validator/adapters/express';

app.post('/users',
  validate({ schema: userSchema, source: 'body' }),
  (req, res) => {
    // req.validatedData contains validated data
  }
);
```

## Why Wenfit Validator?

- **Type-Safe**: Automatic TypeScript type inference
- **Framework-Agnostic**: Use the same schemas everywhere
- **Developer-Friendly**: Intuitive API inspired by popular libraries
- **Production-Ready**: Comprehensive error handling and validation
- **Extensible**: Plugin system for custom needs

[Get Started →](/introduction)
