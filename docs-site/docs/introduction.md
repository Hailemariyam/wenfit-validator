# Introduction

Wenfit Validator is a framework-agnostic, universal validation library for TypeScript. It provides comprehensive type-safe validation with automatic TypeScript inference, works seamlessly across frontend and backend, and includes a rich ecosystem of features and adapters.

Whether you need simple form validation, complex API request validation, async validation, data transformation, or cross-framework schema sharing, Wenfit Validator lets you focus on building your application instead of writing validation logic from scratch.

## Why Wenfit Validator?

**Define Once, Validate Everywhere** - Write your validation schemas once and use them across your entire stack. Share schemas between React frontend and Express backend with full type safety.

**Type Safety First** - Automatic TypeScript type inference means you never manually define types. The validator generates types for you.

**Zero Dependencies** - The core engine has no external dependencies, keeping your bundle size minimal.

**Property-Based Testing** - Built with correctness in mind, using property-based testing to ensure validation works across all possible inputs.

## Key Features

- **Type-safe validation** with automatic TypeScript inference
- **Universal** - works in React, Vue, Angular, Node.js, Express, and NestJS
- **Async validation** support for database checks and API calls
- **Data transformation** to normalize and clean input data
- **Composable schemas** - build complex schemas from simple pieces
- **Custom validation rules** with sync and async support
- **Internationalization** ready with customizable error messages
- **Plugin system** for extensibility
- **Tree-shakeable** - only bundle what you use

## Quick Example

```typescript
import { string, number, object, type Infer } from 'wenfit-validator';

// Define schema
const userSchema = object({
  username: string().min(3).max(20),
  email: string().email(),
  age: number().int().min(18),
});

// Infer TypeScript type
type User = Infer<typeof userSchema>;

// Validate data
const result = userSchema.safeParse({
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
});

if (result.success) {
  console.log('Valid user:', result.data);
  // result.data is typed as User
} else {
  console.error('Validation errors:', result.errors);
}
```

## Installation

```bash
npm install wenfit-validator
```

## Next Steps

- [Core Concepts](./concepts/schemas.md) - Learn about schemas and validation
- [Framework Integration](./integration/react.md) - Integrate with your framework
- [API Reference](./api/primitives.md) - Complete API documentation
- [Examples](../examples/README.md) - Practical usage examples
