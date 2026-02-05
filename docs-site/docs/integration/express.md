# Express Integration

Wenfit Validator provides middleware for validating HTTP requests in Express applications.

## Installation

```bash
npm install wenfit-validator express
```

## Basic Usage

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

app.listen(3000);
```

## API Reference

### validate(options)

Creates Express middleware for request validation.

**Parameters:**

```typescript
interface ValidateOptions {
  schema: Schema<any, any>;
  source?: 'body' | 'query' | 'params';
  onError?: (errors: ValidationErrorData[], req: Request, res: Response) => void;
}
```

**Behavior:**
- **On success**: Calls `next()` and attaches validated data to `req.validatedData`
- **On failure**: Returns 400 status with validation errors (unless custom `onError` provided)

## Validation Sources

### Request Body

Validate POST/PUT/PATCH request bodies:

```typescript
const createPostSchema = object({
  title: string().min(1).max(200),
  content: string().min(10),
  published: boolean().default(false),
});

app.post(
  '/api/posts',
  validate({ schema: createPostSchema, source: 'body' }),
  (req, res) => {
    const postData = req.validatedData;
    res.json({ data: postData });
  }
);
```

### Query Parameters

Validate URL query parameters:

```typescript
const querySchema = object({
  page: number().int().min(1).default(1),
  limit: number().int().min(1).max(100).default(10),
  search: string().optional(),
  sortBy: string().optional(),
});

app.get(
  '/api/posts',
  validate({ schema: querySchema, source: 'query' }),
  (req, res) => {
    const { page, limit, search, sortBy } = req.validatedData;
    // Fetch posts with validated parameters
    res.json({ data: posts, page, limit });
  }
);
```

### Route Parameters

Validate URL path parameters:

```typescript
const paramsSchema = object({
  id: string().pattern(/^[0-9]+$/),
});

app.get(
  '/api/users/:id',
  validate({ schema: paramsSchema, source: 'params' }),
  (req, res) => {
    const { id } = req.validatedData;
    // Fetch user by validated ID
    res.json({ data: user });
  }
);
```

## Multiple Validations

Chain multiple validations for different sources:

```typescript
const paramsSchema = object({
  id: string(),
});

const updateSchema = object({
  nhema,
    source: 'body',
    onError: (errors, req, res) => {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      });
    },
  }),
  handler
);
```

## Async Validation

Async validation is automatically handled:

```typescript
const createProductSchema = object({
  sku: string()
    .pattern(/^SKU-[A-Z0-9]+$/)
    .refine(
      async (val) => {
        const isUnique = await checkSkuUnique(val);
        return isUnique;
      },
      'SKU already exists'
    ),
  name: string().min(1),
  price: number().positive(),
});

app.post(
  '/api/products',
  validate({ schema: createProductSchema, source: 'body' }),
  (req, res) => {
    // Async validation completed before reaching here
    const productData = req.validatedData;
    res.status(201).json({ data: productData });
  }
);
```

## Data Transformation

Transformations are applied automatically:

```typescript
const createPostSchema = object({
  title: string()
    .min(1)
    .max(200)
    .transform(val => val.trim()),
  tags: array(string())
    .transform(tags => tags.map(t => t.toLowerCase().trim())),
  published: boolean().default(false),
});

app.post(
  '/api/posts',
  validate({ schema: createPostSchema, source: 'body' }),
  (req, res) => {
    // req.validatedData.title is trimmed
    // req.validatedData.tags are lowercase and trimmed
    const postData = req.validatedData;
    res.json({ data: postData });
  }
);
```

## TypeScript Integration

Full type safety with inferred types:

```typescript
import { type Infer } from 'wenfit-validator';

const createUserSchema = object({
  username: string().min(3),
  email: string().email(),
  role: enumSchema(['user', 'admin']).default('user'),
});

type CreateUserRequest = Infer<typeof createUserSchema>;

app.post(
  '/api/users',
  validate({ schema: createUserSchema, source: 'body' }),
  (req, res) => {
    // req.validatedData is typed as CreateUserRequest
    const userData: CreateUserRequest = req.validatedData;

    // TypeScript knows the exact shape
    console.log(userData.username); // string
    console.log(userData.email);    // string
    console.log(userData.role);     // 'user' | 'admin'
  }
);
```

## Error Response Format

Default error response structure:

```json
{
  "success": false,
  "errors": [
    {
      "path": ["email"],
      "message": "Please enter a valid email address",
      "code": "string.email",
      "meta": {}
    },
    {
      "path": ["age"],
      "message": "Must be at least 18",
      "code": "number.min",
      "meta": { "min": 18, "actual": 15 }
    }
  ]
}
```

## Complete Example

```typescript
import express, { Request, Response } from 'express';
import { validate } from 'wenfit-validator/adapters/express';
import {
  string,
  number,
  object,
  array,
  enumSchema,
  type Infer
} from 'wenfit-validator';

const app = express();
app.use(express.json());

// ============================================================================
// Schemas
// ============================================================================

const createUserSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: string().email('Please enter a valid email address'),
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase, lowercase, and number'
    ),
  role: enumSchema(['user', 'admin', 'moderator']).default('user'),
});

const updateUserSchema = object({
  username: string().min(3).optional(),
  email: string().email().optional(),
});

const queryUsersSchema = object({
  page: number().int().min(1).default(1),
  limit: number().int().min(1).max(100).default(10),
  role: enumSchema(['user', 'admin', 'moderator']).optional(),
  search: string().optional(),
});

const userIdSchema = object({
  id: string().pattern(/^[0-9]+$/, 'Invalid user ID'),
});

// ============================================================================
// Types
// ============================================================================

type CreateUserRequest = Infer<typeof createUserSchema>;
type UpdateUserRequest = Infer<typeof updateUserSchema>;
type QueryUsersRequest = Infer<typeof queryUsersSchema>;

// ============================================================================
// Routes
// ============================================================================

// Create user
app.post(
  '/api/users',
  validate({ schema: createUserSchema, source: 'body' }),
  async (req: Request, res: Response) => {
    const userData: CreateUserRequest = req.validatedData;

    try {
      // Create user in database
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        createdAt: new Date(),
      };

      // Don't send password in response
      const { password, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
      });
    }
  }
);

// Get users with pagination
app.get(
  '/api/users',
  validate({ schema: queryUsersSchema, source: 'query' }),
  async (req: Request, res: Response) => {
    const { page, limit, role, search }: QueryUsersRequest = req.validatedData;

    // Fetch users from database with validated parameters
    const users = []; // Fetch from DB

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: 100,
          totalPages: Math.ceil(100 / limit),
        },
      },
    });
  }
);

// Get user by ID
app.get(
  '/api/users/:id',
  validate({ schema: userIdSchema, source: 'params' }),
  async (req: Request, res: Response) => {
    const { id } = req.validatedData;

    // Fetch user from database
    const user = {}; // Fetch from DB

    res.json({
      success: true,
      data: user,
    });
  }
);

// Update user
app.patch(
  '/api/users/:id',
  validate({ schema: userIdSchema, source: 'params' }),
  validate({ schema: updateUserSchema, source: 'body' }),
  async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const updates: UpdateUserRequest = req.validatedData;

    // Update user in database
    res.json({
      success: true,
      data: { id, ...updates },
    });
  }
);

// Delete user
app.delete(
  '/api/users/:id',
  validate({ schema: userIdSchema, source: 'params' }),
  async (req: Request, res: Response) => {
    const { id } = req.validatedData;

    // Delete user from database
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  }
);

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing API Endpoints

```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Get users with pagination
curl "http://localhost:3000/api/users?page=1&limit=10&role=user"

# Update user
curl -X PATCH http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe_updated"
  }'

# Invalid request (returns 400)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "invalid-email",
    "password": "weak"
  }'
```

## Next Steps

- [Shared Schemas](../concepts/shared-schemas.md) - Share schemas between frontend and backend
- [Error Handling](../concepts/errors.md) - Learn about error handling
- [Examples](../../examples/express-api-validation.ts) - More examples
