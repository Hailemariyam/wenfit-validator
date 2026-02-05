# Wenfit Validator Documentation

Welcome to the Wenfit Validator documentation! This guide will help you get started with type-safe validation for your TypeScript applications.

## 📚 Documentation Structure

### Getting Started

- **[Introduction](./introduction.md)** - Overview, features, and quick start guide

### Core Concepts

- **[Schemas](./concepts/schemas.md)** - Learn about creating and using validation schemas
- **[Error Handling](./concepts/errors.md)** - Understanding and handling validation errors

### Framework Integration

- **[React](./integration/react.md)** - Form validation with React hooks
- **[Vue](./integration/vue.md)** - Form validation with Vue composables
- **[Angular](./integration/angular.md)** - Form validation with Angular Reactive Forms
- **[Express](./integration/express.md)** - API request validation with Express middleware

### API Reference

- **[Complete API Reference](./API.md)** - Comprehensive API documentation
- **[Framework Adapters](./ADAPTERS.md)** - Detailed adapter documentation

### Examples

- **[Examples Directory](../examples/README.md)** - Practical, working examples
  - [React Form Validation](../examples/react-form-validation.tsx)
  - [Vue Form Validation](../examples/vue-form-validation.vue)
  - [Angular Form Validation](../examples/angular-form-validation.ts)
  - [Express API Validation](../examples/express-api-validation.ts)
  - [Shared Schema Usage](../examples/shared-schema-usage.ts)

## 🚀 Quick Links

### By Use Case

**Building a form?**
- React: [React Integration](./integration/react.md)
- Vue: [Vue Integration](./integration/vue.md)
- Angular: [Angular Integration](./integration/angular.md)

**Building an API?**
- [Express Integration](./integration/express.md)
- [Shared Schemas](./concepts/schemas.md#schema-composition)

**Need to understand errors?**
- [Error Handling](./concepts/errors.md)
- [Custom Error Messages](./concepts/errors.md#custom-error-messages)

**Want type safety?**
- [Type Inference](./concepts/schemas.md#type-inference)
- [TypeScript Integration](./integration/react.md#typescript-integration)

### By Framework

| Framework | Documentation | Example |
|-----------|--------------|---------|
| React | [Guide](./integration/react.md) | [Example](../examples/react-form-validation.tsx) |
| Vue | [Guide](./integration/vue.md) | [Example](../examples/vue-form-validation.vue) |
| Angular | [Guide](./integration/angular.md) | [Example](../examples/angular-form-validation.ts) |
| Express | [Guide](./integration/express.md) | [Example](../examples/express-api-validation.ts) |

## 📖 Learning Path

### Beginner

1. Start with [Introduction](./introduction.md) to understand what Wenfit Validator is
2. Learn about [Schemas](./concepts/schemas.md) to create validation rules
3. Follow your framework's integration guide:
   - [React](./integration/react.md)
   - [Vue](./integration/vue.md)
   - [Angular](./integration/angular.md)
   - [Express](./integration/express.md)

### Intermediate

1. Master [Error Handling](./concepts/errors.md) for better user experience
2. Learn about [Schema Composition](./concepts/schemas.md#schema-composition) for reusable validation
3. Explore [Custom Validation](./concepts/schemas.md#custom-validation) for domain-specific rules
4. Check out [Shared Schema Usage](../examples/shared-schema-usage.ts) for full-stack apps

### Advanced

1. Review the [Complete API Reference](./API.md)
2. Study [Framework Adapters](./ADAPTERS.md) in depth
3. Explore all [Examples](../examples/README.md)
4. Build custom validation patterns for your use case

## 💡 Common Patterns

### Form Validation

```typescript
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, object } from 'wenfit-validator';

const schema = object({
  email: string().email(),
  password: string().min(8),
});

const { validate, getFieldError } = useValidator({ schema });
```

### API Validation

```typescript
import { validate } from 'wenfit-validator/adapters/express';

app.post(
  '/api/users',
  validate({ schema: userSchema, source: 'body' }),
  handler
);
```

### Shared Schemas

```typescript
// shared/schemas.ts
export const userSchema = object({
  username: string().min(3),
  email: string().email(),
});

// Frontend
const { validate } = useValidator({ schema: userSchema });

// Backend
app.post('/api/users', validate({ schema: userSchema }), handler);
```

## 🔍 Search by Topic

### Validation

- [Basic Validation](./concepts/schemas.md#validation-methods)
- [Async Validation](./concepts/schemas.md#async-validation)
- [Custom Rules](./concepts/schemas.md#custom-validation)
- [Data Transformation](./concepts/schemas.md#data-transformation)

### Schema Types

- [Primitives](./concepts/schemas.md#primitive-schemas) (string, number, boolean, date)
- [Objects](./concepts/schemas.md#object-schemas)
- [Arrays](./concepts/schemas.md#array-schemas)
- [Unions & Intersections](./concepts/schemas.md#union-and-intersection)
- [Enums](./concepts/schemas.md#enum-schemas)

### Modifiers

- [Optional](./concepts/schemas.md#optional)
- [Nullable](./concepts/schemas.md#nullable)
- [Default Values](./concepts/schemas.md#default)

### Error Handling

- [Error Structure](./concepts/errors.md#error-structure)
- [Error Codes](./concepts/errors.md#error-codes)
- [Custom Messages](./concepts/errors.md#custom-error-messages)
- [Internationalization](./concepts/errors.md#internationalization)

## 🤝 Contributing

Found an issue or want to improve the documentation? Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details
