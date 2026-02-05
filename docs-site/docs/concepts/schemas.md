# Schemas

Schemas are the foundation of Wenfit Validator. A schema defines the shape and validation rules for your data.

## Creating Schemas

Import schema constructors from the main package:

```typescript
import { string, number, boolean, date, object, array } from 'wenfit-validator';
```

### Primitive Schemas

```typescript
// String
const name = string();
const email = string().email();
const username = string().min(3).max(20);

// Number
const age = number().int().min(0);
const price = number().positive();

// Boolean
const active = boolean();

// Date
const birthDate = date().max(new Date());
```

### Object Schemas

Define complex object structures:

```typescript
const userSchema = object({
  id: string(),
  username: string().min(3),
  email: string().email(),
  profile: object({
    firstName: string(),
    lastName: string(),
    bio: string().optional(),
  }),
});
```

### Array Schemas

Validate arrays with element constraints:

```typescript
const tags = array(string());
const numbers = array(number().int());
const users = array(object({
  id: string(),
  name: string(),
}));

// With constraints
const limitedTags = array(string())
  .min(1)
  .max(10);
```

## Validation Methods

### safeParse()

Returns a result object without throwing. **Recommended for most use cases.**

```typescript
const result = schema.safeParse(data);

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

### parse()

Throws a `ValidationError` on failure. Useful when you want errors to propagate.

```typescript
try {
  const data = schema.parse(input);
  console.log('Valid:', data);
} catch (error) {
  console.error('Invalid:', error);
}
```

## Type Inference

Automatically infer TypeScript types from schemas:

```typescript
import { type Infer } from 'wenfit-validator';

const userSchema = object({
  id: string(),
  username: string(),
  email: string().email(),
});

type User = Infer<typeof userSchema>;
// type User = {
//   id: string;
//   username: string;
//   email: string;
// }
```

## Schema Modifiers

### optional()

Accept `undefined` values:

```typescript
const schema = object({
  name: string(),
  email: string().email().optional(),
});

// Valid
schema.parse({ name: 'John' });
schema.parse({ name: 'John', email: 'john@example.com' });
```

### nullable()

Accept `null` values:

```typescript
const schema = object({
  name: string(),
  deletedAt: date().nullable(),
});

// Valid
schema.parse({ name: 'John', deletedAt: null });
schema.parse({ name: 'John', deletedAt: new Date() });
```

### default()

Provide default values for `undefined` inputs:

```typescript
const schema = object({
  role: string().default('user'),
  active: boolean().default(true),
});

schema.parse({});
// { role: 'user', active: true }
```

## Custom Validation

Add custom validation logic with `refine()`:

```typescript
const passwordSchema = string()
  .min(8)
  .refine(
    (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
    'Password must contain uppercase, lowercase, and number'
  );
```

### Async Validation

Use async predicates for database checks or API calls:

```typescript
const usernameSchema = string()
  .min(3)
  .refine(
    async (val) => {
      const isAvailable = await checkUsernameAvailable(val);
      return isAvailable;
    },
    'Username is already taken'
  );

// Use with await
const result = await schema.safeParse(data);
```

## Data Transformation

Transform validated data with `transform()`:

```typescript
const emailSchema = string()
  .email()
  .transform(val => val.toLowerCase().trim());

const result = emailSchema.parse('  JOHN@EXAMPLE.COM  ');
// 'john@example.com'
```

Multiple transformations are applied in order:

```typescript
const schema = string()
  .trim()
  .toLowerCase()
  .transform(val => val.replace(/\s+/g, '-'));
```

## Schema Composition

### extend()

Add properties to an object schema:

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

### pick()

Select specific properties:

```typescript
const userSchema = object({
  id: string(),
  username: string(),
  email: string().email(),
  password: string(),
});

const publicUserSchema = userSchema.pick(['id', 'username', 'email']);
```

### omit()

Exclude specific properties:

```typescript
const userWithoutPassword = userSchema.omit(['password']);
```

### merge()

Combine two object schemas:

```typescript
const nameSchema = object({
  firstName: string(),
  lastName: string(),
});

const contactSchema = object({
  email: string().email(),
  phone: string(),
});

const personSchema = nameSchema.merge(contactSchema);
```

## Union and Intersection

### union()

Accept one of multiple types (OR logic):

```typescript
import { union } from 'wenfit-validator';

const stringOrNumber = union([string(), number()]);

stringOrNumber.parse('hello'); // ✓
stringOrNumber.parse(42); // ✓
stringOrNumber.parse(true); // ✗
```

### intersection()

Require all types (AND logic):

```typescript
import { intersection } from 'wenfit-validator';

const baseEvent = object({
  id: string(),
  timestamp: date(),
});

const clickEvent = object({
  type: string(),
  elementId: string(),
});

const fullEvent = intersection([baseEvent, clickEvent]);
```

## Enum Schemas

Validate against a set of allowed values:

```typescript
import { enumSchema } from 'wenfit-validator';

const roleSchema = enumSchema(['user', 'admin', 'moderator']);
const statusSchema = enumSchema([0, 1, 2, 3]);

// With default
const roleWithDefault = enumSchema(['user', 'admin']).default('user');
```

## Next Steps

- [Error Handling](./errors.md) - Learn about validation errors
- [React Integration](../integration/react.md) - Use schemas in React
- [Express Integration](../integration/express.md) - Validate API requests
