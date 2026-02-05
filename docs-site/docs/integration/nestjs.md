# NestJS Integration

Wenfit Validator provides comprehensive integration with NestJS through pipes, guards, and decorators for seamless validation in your NestJS applications.

## Installation

```bash
npm install wenfit-validator @nestjs/common @nestjs/core
```

## Quick Start

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { object, string, number } from 'wenfit-validator';
import { BodyValidationPipe } from 'wenfit-validator/adapters/nestjs';

const userSchema = object({
  username: string().min(3).max(20),
  email: string().email(),
  age: number().int().min(18)
});

@Controller('users')
export class UsersController {
  @Post()
  createUser(@Body(new BodyValidationPipe(userSchema)) userData: any) {
    return { message: 'User created', user: userData };
  }
}
```

## Validation Pipes

### BodyValidationPipe

Validates request body data.

```typescript
import { BodyValidationPipe } from 'wenfit-validator/adapters/nestjs';

@Post()
createUser(@Body(new BodyValidationPipe(userSchema)) userData: any) {
  // userData is validated
  return userData;
}
```

### QueryValidationPipe

Validates query parameters.

```typescript
import { QueryValidationPipe } from 'wenfit-validator/adapters/nestjs';

const querySchema = object({
  page: number().int().min(1).default(1),
  limit: number().int().min(1).max(100).default(10),
  search: string().optional()
});

@Get()
getUsers(@Query(new QueryValidationPipe(querySchema)) query: any) {
  // query.page and query.limit have defaults applied
  return { users: [], pagination: query };
}
```

### ParamValidationPipe

Validates route parameters.

```typescript
import { ParamValidationPipe } from 'wenfit-validator/adapters/nestjs';

const paramSchema = object({
  id: string().uuid()
});

@Get(':id')
getUser(@Param(new ParamValidationPipe(paramSchema)) params: any) {
  // params.id is validated as UUID
  return { userId: params.id };
}
```

## Validation Guards

Use guards for more complex validation scenarios.

```typescript
import { UseGuards } from '@nestjs/common';
import { ValidationGuard, ValidatedBody } from 'wenfit-validator/adapters/nestjs';

@Post()
@UseGuards(new ValidationGuard(userSchema, 'body'))
createUser(@ValidatedBody() userData: any) {
  // userData is validated via guard
  return userData;
}
```

### Guard with Query Parameters

```typescript
@Get()
@UseGuards(new ValidationGuard(querySchema, 'query'))
getUsers(@ValidatedQuery() query: any) {
  return { users: [], query };
}
```

### Guard with Route Parameters

```typescript
@Get(':id')
@UseGuards(new ValidationGuard(paramSchema, 'params'))
getUser(@ValidatedParams() params: any) {
  return { userId: params.id };
}
```

## Using @UsePipes Decorator

Apply validation pipes at the method level.

```typescript
import { UsePipes } from '@nestjs/common';

@Post()
@UsePipes(new BodyValidationPipe(userSchema))
createUser(@Body() userData: any) {
  return userData;
}
```

## Global Validation Pipe

Apply validation globally in your `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from 'wenfit-validator/adapters/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global validation
  app.useGlobalPipes(new ValidationPipe(globalSchema));

  await app.listen(3000);
}
bootstrap();
```

## Helper Functions

Create validation pipes using helper functions.

```typescript
import {
  createBodyValidationPipe,
  createQueryValidationPipe,
  createParamValidationPipe
} from 'wenfit-validator/adapters/nestjs';

@Post()
createUser(@Body(createBodyValidationPipe(userSchema)) userData: any) {
  return userData;
}

@Get()
getUsers(@Query(createQueryValidationPipe(querySchema)) query: any) {
  return { users: [], query };
}

@Get(':id')
getUser(@Param(createParamValidationPipe(paramSchema)) params: any) {
  return { userId: params.id };
}
```

## Type-Safe Validation

Combine with TypeScript for full type safety.

```typescript
import { Infer } from 'wenfit-validator';

const userSchema = object({
  username: string().min(3),
  email: string().email(),
  age: number().int().min(18)
});

type UserDto = Infer<typeof userSchema>;

@Post()
createUser(@Body(new BodyValidationPipe(userSchema)) userData: UserDto) {
  // userData is fully typed!
  const username: string = userData.username;
  const email: string = userData.email;
  const age: number = userData.age;

  return userData;
}
```

## Error Handling

Validation errors are automatically thrown as `BadRequestException`.

```typescript
// Validation failure response:
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email format",
      "code": "invalid_email"
    }
  ]
}
```

### Custom Error Handling

Handle validation errors manually for custom responses.

```typescript
@Post()
async createUser(@Body() userData: any) {
  const result = userSchema.safeParse(userData);

  if (!result.success) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: result.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }))
    };
  }

  return { user: result.data };
}
```

## Complex Validation Examples

### Nested Objects

```typescript
const addressSchema = object({
  street: string(),
  city: string(),
  state: string(),
  zipCode: string().regex(/^\d{5}(-\d{4})?$/)
});

const orderSchema = object({
  items: array(object({
    productId: string().uuid(),
    quantity: number().int().min(1),
    price: number().min(0)
  })).min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional()
});

@Post('orders')
createOrder(@Body(new BodyValidationPipe(orderSchema)) orderData: any) {
  return { order: orderData };
}
```

### Multiple Validations

```typescript
@Put(':id')
updateUser(
  @Param(new ParamValidationPipe(paramSchema)) params: any,
  @Body(new BodyValidationPipe(updateSchema)) userData: any,
  @Query(new QueryValidationPipe(querySchema)) query: any
) {
  return {
    userId: params.id,
    updates: userData,
    options: query
  };
}
```

### Conditional Validation

```typescript
const paymentSchema = object({
  method: string().enum(['credit_card', 'paypal', 'bank_transfer']),
  amount: number().min(0)
}).refine(
  (data) => {
    if (data.method === 'credit_card') {
      return data.amount <= 10000;
    }
    return true;
  },
  { message: 'Credit card payments limited to $10,000' }
);

@Post('payments')
processPayment(@Body(new BodyValidationPipe(paymentSchema)) payment: any) {
  return { payment };
}
```

## Best Practices

### 1. Define Schemas Separately

```typescript
// schemas/user.schema.ts
export const createUserSchema = object({
  username: string().min(3).max(20),
  email: string().email(),
  password: string().min(8)
});

export const updateUserSchema = object({
  username: string().min(3).max(20).optional(),
  email: string().email().optional()
});

// controllers/user.controller.ts
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
```

### 2. Use Type Inference

```typescript
import { Infer } from 'wenfit-validator';

export type CreateUserDto = Infer<typeof createUserSchema>;
export type UpdateUserDto = Infer<typeof updateUserSchema>;
```

### 3. Reuse Schemas

```typescript
const baseUserSchema = object({
  username: string().min(3).max(20),
  email: string().email()
});

const createUserSchema = baseUserSchema.extend({
  password: string().min(8)
});

const updateUserSchema = baseUserSchema.partial();
```

### 4. Add Custom Error Messages

```typescript
const userSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters'),
  email: string()
    .email('Please provide a valid email address')
});
```

## API Reference

### Pipes

- `ValidationPipe` - Generic validation pipe
- `BodyValidationPipe` - Validates request body
- `QueryValidationPipe` - Validates query parameters
- `ParamValidationPipe` - Validates route parameters

### Guards

- `ValidationGuard` - Guard for schema validation

### Decorators

- `@ValidatedBody()` - Get validated body data
- `@ValidatedQuery()` - Get validated query data
- `@ValidatedParams()` - Get validated params data

### Helper Functions

- `createValidationPipe(schema)` - Create generic validation pipe
- `createBodyValidationPipe(schema)` - Create body validation pipe
- `createQueryValidationPipe(schema)` - Create query validation pipe
- `createParamValidationPipe(schema)` - Create param validation pipe
- `createValidationGuard(schema, source)` - Create validation guard

## Complete Example

See the [NestJS API Validation Example](../../examples/nestjs-api-validation.ts) for a comprehensive demonstration of all features.

## Next Steps

- Learn about [Error Handling](../concepts/errors.md)
- Explore [Schema Composition](../concepts/schemas.md)
- Check out the [API Reference](../API.md)
