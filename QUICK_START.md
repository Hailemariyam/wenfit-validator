# ⚡ Quick Start Guide

Get up and running with Wenfit Validator in 5 minutes!

## 📦 Installation

```bash
npm install wenfit-validator
```

## 🎯 Basic Usage

### 1. Simple Validation

```typescript
import { string, number, object } from 'wenfit-validator';

// Create a schema
const userSchema = object({
  name: string().min(2),
  age: number().min(18)
});

// Validate data
const result = userSchema.safeParse({
  name: "John",
  age: 25
});

if (result.success) {
  console.log("✅ Valid:", result.data);
} else {
  console.log("❌ Errors:", result.errors);
}
```

### 2. With TypeScript Types

```typescript
import { object, string, number, type Infer } from 'wenfit-validator';

const productSchema = object({
  id: string(),
  name: string(),
  price: number().positive()
});

// Automatically infer the type!
type Product = Infer<typeof productSchema>;
// { id: string; name: string; price: number }

function saveProduct(product: Product) {
  // product is fully typed
}
```

### 3. React Form

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { object, string } from 'wenfit-validator';

const schema = object({
  email: string().email(),
  password: string().min(8)
});

function LoginForm() {
  const { validate, errors, getFieldError } = useValidator({ schema });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await validate(data);
    if (result.success) {
      // Login user
      console.log("Login:", result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      {getFieldError('email') && <span>{getFieldError('email').message}</span>}

      <input name="password" type="password" />
      {getFieldError('password') && <span>{getFieldError('password').message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### 4. Express API

```typescript
import express from 'express';
import { validate } from 'wenfit-validator/adapters/express';
import { object, string, number } from 'wenfit-validator';

const app = express();
app.use(express.json());

const createUserSchema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

app.post('/users',
  validate({ schema: createUserSchema, source: 'body' }),
  (req, res) => {
    // req.body is validated and typed!
    const user = req.body;
    res.json({ success: true, user });
  }
);

app.listen(3000);
```

### 5. Vue 3 Form

```vue
<script setup>
import { reactive } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { object, string, number } from 'wenfit-validator';

const schema = object({
  name: string().min(2),
  email: string().email(),
  age: number().min(18)
});

const { validate, errors, getFieldError } = useValidation(schema);

const form = reactive({
  name: '',
  email: '',
  age: null
});

const handleSubmit = async () => {
  const result = await validate(form);
  if (result.success) {
    console.log("Valid:", result.data);
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="Name" />
    <span v-if="getFiechema = string().email();
```

### Password with Requirements

```typescript
const passwordSchema = string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (val) => /[A-Z]/.test(val),
    "Must contain uppercase letter"
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "Must contain number"
  );
```

### Optional Fields

```typescript
const userSchema = object({
  name: string(),
  nickname: string().optional(),  // string | undefined
  bio: string().nullable()        // string | null
});
```

### Arrays

```typescript
const tagsSchema = array(string())
  .min(1, "At least one tag required")
  .max(5, "Maximum 5 tags");
```

### Nested Objects

```typescript
const orderSchema = object({
  customer: object({
    name: string(),
    email: string().email()
  }),
  items: array(object({
    productId: string(),
    quantity: number().min(1)
  }))
});
```

### Async Validation

```typescript
const usernameSchema = string()
  .min(3)
  .refine(
    async (username) => {
      const available = await checkAvailability(username);
      return available;
    },
    "Username already taken"
  );
```

### Data Transformation

```typescript
const userSchema = object({
  email: string().email().toLowerCase().trim(),
  age: string().transform(parseInt),
  tags: array(string()).transform(tags => tags.map(t => t.toUpperCase()))
});
```

## 📚 Next Steps

- **[Full Documentation](./docs/README.md)** - Complete API reference
- **[React Guide](./docs/integration/react.md)** - React integration
- **[Vue Guide](./docs/integration/vue.md)** - Vue integration
- **[Express Guide](./docs/integration/express.md)** - Express integration
- **[Examples](./examples/README.md)** - More examples

## 💡 Tips

1. **Use `safeParse` for user input** - It never throws, perfect for forms
2. **Use `parse` for internal validation** - Throws on error, good for APIs
3. **Share schemas** - Define once, use in frontend and backend
4. **Leverage type inference** - Let TypeScript infer types from schemas
5. **Custom messages** - Add user-friendly error messages

## 🆘 Need Help?

- 📖 [Documentation](./docs/README.md)
- 💬 [GitHub Discussions](https://github.com/yourusername/wenfit-validator/discussions)
- 🐛 [Report Issues](https://github.com/yourusername/wenfit-validator/issues)

---

Happy validating! 🚀
