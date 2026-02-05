/**
 * NestJS API Validation Example
 *
 * This example demonstrates how to use Wenfit Validator with NestJS
 * for API request validation using pipes, guards, and decorators.
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Query,
    Param,
    UseGuards,
    UseFilters,
    Injectable,
} from '@nestjs/common';
import {
    ValidationPipe,
    BodyValidationPipe,
    QueryValidationPipe,
    ParamValidationPipe,
    ValidationGuard,
    ValidationExceptionFilter,
    validate,
} from 'wenfit-validator/adapters/nestjs';
import {
    string,
    number,
    object,
    array,
    enumSchema,
    boolean,
    date,
    type Infer,
} from 'wenfit-validator';

// ============================================================================
// User Management API
// ============================================================================

// Schema for creating a new user
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
            'Password must contain uppercase, lowercase, and a number'
        ),
    role: enumSchema(['user', 'admin', 'moderator']).default('user'),
    profile: object({
        firstName: string().min(1, 'First name is required'),
        lastName: string().min(1, 'Last name is required'),
        bio: string().max(500, 'Bio cannot exceed 500 characters').optional(),
        age: number().int().min(18, 'Must be at least 18 years old').optional(),
    }),
});

type CreateUserDto = Infer<typeof createUserSchema>;

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
        age: number().int().min(18).optional(),
    }).optional(),
});

type UpdateUserDto = Infer<typeof updateUserSchema>;

// Schema for user ID parameter
const userIdSchema = object({
    id: string().min(1, 'User ID is required'),
});

// Schema for query parameters
const userQuerySchema = object({
    page: number().int().min(1).default(1),
    limit: number().int().min(1).max(100).default(10),
    role: enumSchema(['user', 'admin', 'moderator']).optional(),
    search: string().max(100).optional(),
});

type UserQueryDto = Infer<typeof userQuerySchema>;

/**
 * Users Controller - Demonstrates different validation approaches
 */
@Controller('users')
@UseFilters(new ValidationExceptionFilter())
export class UsersController {
    /**
     * Example 1: Using ValidationPipe directly on parameter
     * POST /users - Create a new user
     */
    @Post()
    async createUser(
        @Body(new BodyValidationPipe(createUserSchema)) data: CreateUserDto
    ) {
        // data is already validated and typed
        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            createdAt: new Date(),
        };

        // Don't send password in response
        const { password, ...userResponse } = newUser;

        return {
            success: true,
            data: userResponse,
        };
    }

    /**
     * Example 2: Using ValidationGuard at route level
     * GET /users - Get all users with pagination
     */
    @Get()
    async findAll(
        @Query(new QueryValidationPipe(userQuerySchema)) query: UserQueryDto
    ) {
        // Simulate database query
        const users = [
            {
                id: '1',
                username: 'john_doe',
                email: 'john@example.com',
                role: 'user',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                },
            },
            // More users...
        ];

        return {
            success: true,
            data: {
                users,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: 100,
                    totalPages: Math.ceil(100 / query.limit),
                },
            },
        };
    }

    /**
     * Example 3: Using ParamValidationPipe for route parameters
     * GET /users/:id - Get a specific user
     */
    @Get(':id')
    async findOne(
        @Param(new ParamValidationPipe(userIdSchema)) params: { id: string }
    ) {
        return {
            success: true,
            data: {
                id: params.id,
                username: 'john_doe',
                email: 'john@example.com',
            },
        };
    }

    /**
     * Example 4: Multiple validations (params + body)
     * PUT /users/:id - Update a user
     */
    @Put(':id')
    async updateUser(
        @Param(new ParamValidationPipe(userIdSchema)) params: { id: string },
        @Body(new BodyValidationPipe(updateUserSchema)) data: UpdateUserDto
    ) {
        return {
            success: true,
            data: {
                id: params.id,
                ...data,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Example 5: Using ValidationGuard
     * DELETE /users/:id - Delete a user
     */
    @Delete(':id')
    @UseGuards(new ValidationGuard({ schema: userIdSchema, source: 'params' }))
    async deleteUser(@Param('id') id: string) {
        return {
            success: true,
            message: `User ${id} deleted successfully`,
        };
    }
}

// ============================================================================
// Blog Post API
// ============================================================================

const createPostSchema = object({
    title: string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters')
        .transform(val => val.trim()),
    content: string()
        .min(10, 'Content must be at least 10 characters')
        .max(10000, 'Content cannot exceed 10000 characters')
        .transform(val => val.trim()),
    tags: array(string().min(1).max(50))
        .max(10, 'Cannot have more than 10 tags')
        .transform(tags => tags.map(t => t.toLowerCase().trim())),
    published: boolean().default(false),
    publishDate: date().optional(),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']),
});

type CreatePostDto = Infer<typeof createPostSchema>;

const updatePostSchema = object({
    title: string().min(1).max(200).transform(val => val.trim()).optional(),
    content: string().min(10).max(10000).transform(val => val.trim()).optional(),
    tags: array(string().min(1).max(50))
        .max(10)
        .transform(tags => tags.map(t => t.toLowerCase().trim()))
        .optional(),
    published: boolean().optional(),
    publishDate: date().optional(),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']).optional(),
});

type UpdatePostDto = Infer<typeof updatePostSchema>;

const postQuerySchema = object({
    page: number().int().min(1).default(1),
    limit: number().int().min(1).max(100).default(10),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']).optional(),
    published: boolean().optional(),
    search: string().max(100).optional(),
});

type PostQueryDto = Infer<typeof postQuerySchema>;

@Controller('posts')
@UseFilters(new ValidationExceptionFilter())
export class PostsController {
    @Post()
    async createPost(
        @Body(new BodyValidationPipe(createPostSchema)) data: CreatePostDto
    ) {
        const newPost = {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            author: {
                id: 'user-123',
                username: 'john_doe',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return {
            success: true,
            data: newPost,
        };
    }

    @Get()
    async findAll(
        @Query(new QueryValidationPipe(postQuerySchema)) query: PostQueryDto
    ) {
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
        ];

        return {
            success: true,
            data: {
                posts,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: 100,
                    totalPages: Math.ceil(100 / query.limit),
                },
            },
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: {
                id,
                title: 'Sample Post',
                content: 'This is a sample post content.',
            },
        };
    }

    @Put(':id')
    async updatePost(
        @Param('id') id: string,
        @Body(new BodyValidationPipe(updatePostSchema)) data: UpdatePostDto
    ) {
        return {
            success: true,
            data: {
                id,
                ...data,
                updatedAt: new Date(),
            },
        };
    }

    @Delete(':id')
    async deletePost(@Param('id') id: string) {
        return {
            success: true,
            message: `Post ${id} deleted successfully`,
        };
    }
}

// ============================================================================
// Product API with Service Layer Validation
// ============================================================================

// Simulate checking if SKU is unique
async function checkSkuUnique(sku: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const existingSkus = ['SKU-001', 'SKU-002', 'SKU-003'];
    return !existingSkus.includes(sku);
}

const createProductSchema = object({
    name: string().min(1).max(200),
    description: string().max(2000),
    sku: string()
        .pattern(/^SKU-[A-Z0-9]+$/, 'SKU must start with "SKU-" followed by alphanumeric characters')
        .refine(
            async (val) => await checkSkuUnique(val),
            'SKU already exists'
        ),
    price: number()
        .positive('Price must be positive')
        .refine(
            (val) => val === Math.round(val * 100) / 100,
            'Price must have at most 2 decimal places'
        ),
    category: enumSchema(['electronics', 'clothing', 'books', 'food']),
    inStock: boolean().default(true),
    tags: array(string()).max(20, 'Cannot have more than 20 tags'),
});

type CreateProductDto = Infer<typeof createProductSchema>;

/**
 * Products Service - Demonstrates validation in service layer
 */
@Injectable()
export class ProductsService {
    async createProduct(data: unknown) {
        // Validate in service layer
        const result = await validate(createProductSchema, data);

        if (!result.success) {
            throw new Error('Validation failed: ' + JSON.stringify(result.errors));
        }

        const newProduct = {
            id: Math.random().toString(36).substr(2, 9),
            ...result.data,
            createdAt: new Date(),
        };

        return newProduct;
    }

    async findAll() {
        return [
            {
                id: '1',
                name: 'Premium Laptop',
                sku: 'SKU-LAPTOP-001',
                price: 1299.99,
                category: 'electronics',
            },
        ];
    }
}

@Controller('products')
@UseFilters(new ValidationExceptionFilter())
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    /**
     * Example with async validation (SKU uniqueness check)
     */
    @Post()
    async createProduct(
        @Body(new BodyValidationPipe(createProductSchema)) data: CreateProductDto
    ) {
        const product = await this.productsService.createProduct(data);

        return {
            success: true,
            data: product,
        };
    }

    @Get()
    async findAll() {
        const products = await this.productsService.findAll();

        return {
            success: true,
            data: products,
        };
    }
}

// ============================================================================
// Module Setup
// ============================================================================

import { Module } from '@nestjs/common';

@Module({
    controllers: [UsersController, PostsController, ProductsController],
    providers: [ProductsService],
})
export class AppModule { }

// ============================================================================
// Example Usage with curl
// ============================================================================

/*

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Software developer",
      "age": 25
    }
  }'

# Get users with pagination
curl "http://localhost:3000/users?page=1&limit=10&role=user"

# Get a specific user
curl http://localhost:3000/users/user-123

# Update a user
curl -X PUT http://localhost:3000/users/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "bio": "Updated bio"
    }
  }'

# Delete a user
curl -X DELETE http://localhost:3000/users/user-123

# Create a blog post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "  My First Post  ",
    "content": "This is the content of my first blog post.",
    "tags": ["  JavaScript  ", "TypeScript", "  WEB  "],
    "category": "tech",
    "published": true
  }'

# Query posts
curl "http://localhost:3000/posts?page=1&limit=10&category=tech&published=true"

# Create a product (with async validation)
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop",
    "description": "High-performance laptop for developers",
    "sku": "SKU-LAPTOP-999",
    "price": 1299.99,
    "category": "electronics",
    "tags": ["laptop", "computer", "electronics"]
  }'

# Invalid request (will return 400 with validation errors)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "invalid-email",
    "password": "weak"
  }'

*/
