/**
 * Express API Validation Example
 *
 * This example demonstrates how to use Wenfit Validator with Express
 * for API request validation.
 */

import express, { Request, Response } from 'express';
import { validate } from 'wenfit-validator/adapters/express';
import {
    string,
    number,
    object,
    array,
    enumSchema,
    boolean,
    date,
    type Infer
} from 'wenfit-validator';

// Extend Express Request type to include validatedData
declare global {
    namespace Express {
        interface Request {
            validatedData?: any;
        }
    }
}

const app = express();
app.use(express.json());

// ============================================================================
// User Management API
// ============================================================================

// Schema for creating a new user
const createUserSchema = object({
    username: string()
        .min(3)
        .max(20)
        .pattern(/^[a-zA-Z0-9_]+$/),
    email: string().email(),
    password: string()
        .min(8)
        .refine(
            (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
            'Password must contain uppercase, lowercase, and number'
        ),
    role: enumSchema(['user', 'admin', 'moderator']).default('user'),
    profile: object({
        firstName: string().min(1),
        lastName: string().min(1),
        bio: string().max(500).optional(),
    }),
});

type CreateUserRequest = Infer<typeof createUserSchema>;

// Schema for updating a user
const updateUserSchema = object({
    username: string()
        .min(3)
        .max(20)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .optional(),
    email: string().email().optional(),
    role: enumSchema(['user', 'admin', 'moderator']).optional(),
    profile: object({
        firstName: string().min(1).optional(),
        lastName: string().min(1).optional(),
        bio: string().max(500).optional(),
    }).optional(),
});

type UpdateUserRequest = Infer<typeof updateUserSchema>;

// POST /api/users - Create a new user
app.post(
    '/api/users',
    validate({ schema: createUserSchema, source: 'body' }),
    async (req: Request, res: Response) => {
        // req.validatedData contains the validated and typed data
        const userData: CreateUserRequest = req.validatedData;

        try {
            // Simulate database operation
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

// PATCH /api/users/:id - Update a user
app.patch(
    '/api/users/:id',
    validate({
        schema: object({ id: string() }),
        source: 'params'
    }),
    validate({ schema: updateUserSchema, source: 'body' }),
    async (req: Request, res: Response) => {
        const { id } = req.validatedData;
        const updates = req.validatedData;

        // Simulate database update
        res.json({
            success: true,
            data: {
                id,
                ...updates,
                updatedAt: new Date(),
            },
        });
    }
);

// ============================================================================
// Blog Post API
// ============================================================================

// Schema for creating a blog post
const createPostSchema = object({
    title: string()
        .min(1)
        .max(200)
        .transform(val => val.trim()),
    content: string()
        .min(10)
        .max(10000)
        .transform(val => val.trim()),
    tags: array(string().min(1).max(50))
        .max(10)
        .transform(tags => tags.map(t => t.toLowerCase().trim())),
    published: boolean().default(false),
    publishDate: date().optional(),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']),
});

type CreatePostRequest = Infer<typeof createPostSchema>;

// POST /api/posts - Create a new blog post
app.post(
    '/api/posts',
    validate({ schema: createPostSchema, source: 'body' }),
    async (req: Request, res: Response) => {
        const postData: CreatePostRequest = req.validatedData;

        const newPost = {
            id: Math.random().toString(36).substr(2, 9),
            ...postData,
            author: {
                id: 'user-123', // Would come from auth middleware
                username: 'john_doe',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        res.status(201).json({
            success: true,
            data: newPost,
        });
    }
);

// Schema for querying posts
const queryPostsSchema = object({
    page: number().int().min(1).default(1),
    limit: number().int().min(1).max(100).default(10),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']).optional(),
    published: boolean().optional(),
    search: string().max(100).optional(),
});

// GET /api/posts - Get posts with pagination and filtering
app.get(
    '/api/posts',
    validate({ schema: queryPostsSchema, source: 'query' }),
    async (req: Request, res: Response) => {
        const { page, limit, category, published, search } = req.validatedData;

        // Simulate database query
        const posts = [
            {
                id: '1',
                title: 'Getting Started with TypeScript',
                content: 'TypeScript is a typed superset of JavaScript...',
                tags: ['typescript', 'javascript', 'programming'],
                published: true,
                category: 'tech',
                createdAt: new Date(),
            },
            // More posts...
        ];

        res.json({
            success: true,
            data: {
                posts,
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

// ============================================================================
// Product API with Async Validation
// ============================================================================

// Simulate checking if SKU is unique
async function checkSkuUnique(sku: string): Promise<boolean> {
    // In real app, query database
    await new Promise(resolve => setTimeout(resolve, 100));
    const existingSkus = ['SKU-001', 'SKU-002', 'SKU-003'];
    return !existingSkus.includes(sku);
}

const createProductSchema = object({
    name: string().min(1).max(200),
    description: string().max(2000),
    sku: string()
        .pattern(/^SKU-[A-Z0-9]+$/)
        .refine(
            async (val) => await checkSkuUnique(val),
            'SKU already exists'
        ),
    price: number()
        .positive()
        .refine(
            (val) => val === Math.round(val * 100) / 100,
            'Price must have at most 2 decimal places'
        ),
    category: enumSchema(['electronics', 'clothing', 'books', 'food']),
    inStock: boolean().default(true),
    tags: array(string()).max(20),
});

// POST /api/products - Create a new product (with async validation)
app.post(
    '/api/products',
    validate({ schema: createProductSchema, source: 'body' }),
    async (req: Request, res: Response) => {
        const productData = req.validatedData;

        const newProduct = {
            id: Math.random().toString(36).substr(2, 9),
            ...productData,
            createdAt: new Date(),
        };

        res.status(201).json({
            success: true,
            data: newProduct,
        });
    }
);

// ============================================================================
// Error Handling
// ============================================================================

// Global error handler
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
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST   /api/users`);
    console.log(`  PATCH  /api/users/:id`);
    console.log(`  POST   /api/posts`);
    console.log(`  GET    /api/posts`);
    console.log(`  POST   /api/products`);
});

// ============================================================================
// Example Usage with curl
// ============================================================================

/*

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Software developer"
    }
  }'

# Create a blog post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "  My First Post  ",
    "content": "This is the content of my first blog post.",
    "tags": ["  JavaScript  ", "TypeScript", "  WEB  "],
    "category": "tech",
    "published": true
  }'

# Query posts
curl "http://localhost:3000/api/posts?page=1&limit=10&category=tech&published=true"

# Create a product (with async validation)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop",
    "description": "High-performance laptop for developers",
    "sku": "SKU-LAPTOP-001",
    "price": 1299.99,
    "category": "electronics",
    "tags": ["laptop", "computer", "electronics"]
  }'

# Invalid request (will return 400 with validation errors)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "invalid-email",
    "password": "weak"
  }'

*/
