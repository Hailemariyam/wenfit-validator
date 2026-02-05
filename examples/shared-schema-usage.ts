/**
 * Shared Schema Usage Example
 *
 * This example demonstrates how to define schemas once and use them
 * across both frontend and backend applications.
 */

// ============================================================================
// shared/schemas.ts - Shared schema definitions
// ============================================================================

import { string, number, object, array, enumSchema, date, boolean, type Infer } from 'wenfit-validator';

/**
 * User Schema
 * Used for user registration, profile updates, and API responses
 */
export const userSchema = object({
    id: string(),
    username: string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/),
    email: string().email(),
    role: enumSchema(['user', 'admin', 'moderator']),
    profile: object({
        firstName: string().min(1),
        lastName: string().min(1),
        bio: string().max(500).optional(),
        avatar: string().url().optional(),
    }),
    createdAt: string(), // ISO date string for API compatibility
    updatedAt: string(),
});

export type User = Infer<typeof userSchema>;

/**
 * Create User Request Schema
 * Used for user registration
 */
export const createUserRequestSchema = object({
    username: string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/),
    email: string().email(),
    password: string()
        .min(8)
        .refine(
            (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
            'Password must contain uppercase, lowercase, and number'
        ),
    profile: object({
        firstName: string().min(1),
        lastName: string().min(1),
        bio: string().max(500).optional(),
    }),
});

export type CreateUserRequest = Infer<typeof createUserRequestSchema>;

/**
 * Update User Request Schema
 * Used for profile updates
 */
export const updateUserRequestSchema = object({
    username: string().min(3).max(20).optional(),
    email: string().email().optional(),
    profile: object({
        firstName: string().min(1).optional(),
        lastName: string().min(1).optional(),
        bio: string().max(500).optional(),
        avatar: string().url().optional(),
    }).optional(),
});

export type UpdateUserRequest = Infer<typeof updateUserRequestSchema>;

/**
 * Post Schema
 * Used for blog posts
 */
export const postSchema = object({
    id: string(),
    title: string(),
    content: string(),
    excerpt: string().optional(),
    tags: array(string()),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']),
    published: boolean(),
    publishDate: date().optional(),
    author: object({
        id: string(),
        username: string(),
        avatar: string().url().optional(),
    }),
    createdAt: string(),
    updatedAt: string(),
});

export type Post = Infer<typeof postSchema>;

/**
 * Create Post Request Schema
 */
export const createPostRequestSchema = object({
    title: string()
        .min(1)
        .max(200)
        .transform(val => val.trim()),
    content: string()
        .min(10)
        .max(10000)
        .transform(val => val.trim()),
    excerpt: string()
        .max(300)
        .transform(val => val.trim())
        .optional(),
    tags: array(string().min(1).max(50))
        .max(10)
        .transform(tags => tags.map(t => t.toLowerCase().trim())),
    category: enumSchema(['tech', 'lifestyle', 'business', 'other']),
    published: boolean().default(false),
    publishDate: date().optional(),
});

export type CreatePostRequest = Infer<typeof createPostRequestSchema>;

/**
 * Query Parameters Schema
 * Used for paginated list endpoints
 */
export const paginationQuerySchema = object({
    page: number().int().min(1).default(1),
    limit: number().int().min(1).max(100).default(10),
    sortBy: string().optional(),
    sortOrder: enumSchema(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = Infer<typeof paginationQuerySchema>;

// ============================================================================
// Backend Usage (Express API)
// ============================================================================

import express, { Request, Response } from 'express';
import { validate } from 'wenfit-validator/adapters/express';

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

// Use shared schema for API validation
app.post(
    '/api/users',
    validate({ schema: createUserRequestSchema, source: 'body' }),
    async (req: Request, res: Response) => {
        const userData: CreateUserRequest = req.validatedData;

        // Create user in database
        const newUser: User = {
            id: generateId(),
            username: userData.username,
            email: userData.email,
            role: 'user',
            profile: {
                ...userData.profile,
                avatar: undefined, // Optional field
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Validate response against schema before sending
        const validatedUser = userSchema.parse(newUser);

        res.status(201).json({
            success: true,
            data: validatedUser,
        });
    }
);

app.get(
    '/api/posts',
    validate({ schema: paginationQuerySchema, source: 'query' }),
    async (req: Request, res: Response) => {
        const { page, limit, sortBy, sortOrder } = req.validatedData;

        // Fetch posts from database
        const posts: Post[] = await fetchPosts({ page, limit, sortBy, sortOrder });

        // Validate each post against schema
        const validatedPosts = posts.map(post => postSchema.parse(post));

        res.json({
            success: true,
            data: {
                posts: validatedPosts,
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
// Frontend Usage (React)
// ============================================================================

import React, { useState } from 'react';
import { useValidator } from 'wenfit-validator/adapters/react';

function CreatePostForm() {
    const [formData, setFormData] = useState<Partial<CreatePostRequest>>({
        title: '',
        content: '',
        excerpt: '',
        tags: [],
        category: 'tech',
        published: false,
    });

    // Use the same schema on frontend
    const { validate, errors, getFieldError } = useValidator({
        schema: createPostRequestSchema,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate on frontend before sending to API
        const result = await validate(formData);

        if (result.success) {
            // Send to API
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.data),
            });

            if (response.ok) {
                const { data } = await response.json();

                // Validate API response
                const validatedPost = postSchema.parse(data);
                console.log('Post created:', validatedPost);
            }
        }
    };

    // JSX would be:
    // return (
    //     <form onSubmit={handleSubmit}>
    //         {/* Form fields */}
    //     </form>
    // );

    return null; // Placeholder for actual JSX
}

// ============================================================================
// Type-Safe API Client
// ============================================================================

/**
 * Type-safe API client using shared schemas
 */
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Create a new user
     */
    async createUser(data: CreateUserRequest): Promise<User> {
        // Validate request data
        const validatedData = createUserRequestSchema.parse(data);

        const response = await fetch(`${this.baseUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
            throw new Error('Failed to create user');
        }

        const { data: userData } = await response.json();

        // Validate response data
        return userSchema.parse(userData);
    }

    /**
     * Get user by ID
     */
    async getUser(id: string): Promise<User> {
        const response = await fetch(`${this.baseUrl}/api/users/${id}`);

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        const { data } = await response.json();

        // Validate response data
        return userSchema.parse(data);
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
        // Validate request data
        const validatedData = updateUserRequestSchema.parse(data);

        const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
            throw new Error('Failed to update user');
        }

        const { data: userData } = await response.json();

        // Validate response data
        return userSchema.parse(userData);
    }

    /**
     * Get posts with pagination
     */
    async getPosts(query: PaginationQuery): Promise<{ posts: Post[]; pagination: any }> {
        // Validate query parameters
        const validationResult = paginationQuerySchema.parse(query);
        const validatedQuery = validationResult instanceof Promise
            ? await validationResult
            : validationResult;

        const params = new URLSearchParams({
            page: validatedQuery.page.toString(),
            limit: validatedQuery.limit.toString(),
            sortOrder: validatedQuery.sortOrder,
            ...(validatedQuery.sortBy && { sortBy: validatedQuery.sortBy }),
        });

        const response = await fetch(`${this.baseUrl}/api/posts?${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const { data } = await response.json();

        // Validate each post
        const validatedPosts = data.posts.map((post: any) => postSchema.parse(post));

        return {
            posts: validatedPosts,
            pagination: data.pagination,
        };
    }

    /**
     * Create a new post
     */
    async createPost(data: CreatePostRequest): Promise<Post> {
        // Validate request data
        const validatedData = createPostRequestSchema.parse(data);

        const response = await fetch(`${this.baseUrl}/api/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const { data: postData } = await response.json();

        // Validate response data
        return postSchema.parse(postData);
    }
}

// ============================================================================
// Usage Example
// ============================================================================

async function example() {
    const api = new ApiClient('http://localhost:3000');

    try {
        // Create a user - type-safe and validated
        const newUser = await api.createUser({
            username: 'john_doe',
            email: 'john@example.com',
            password: 'SecurePass123',
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                bio: 'Software developer',
            },
        });

        console.log('User created:', newUser);

        // Create a post - type-safe and validated
        const newPost = await api.createPost({
            title: 'My First Post',
            content: 'This is the content of my first blog post.',
            excerpt: undefined,
            tags: ['javascript', 'typescript'],
            category: 'tech',
            published: true,
            publishDate: undefined,
        });

        console.log('Post created:', newPost);

        // Get posts with pagination - type-safe and validated
        const { posts, pagination } = await api.getPosts({
            page: 1,
            limit: 10,
            sortBy: undefined,
            sortOrder: 'desc',
        });

        console.log('Posts:', posts);
        console.log('Pagination:', pagination);

    } catch (error) {
        console.error('API error:', error);
    }
}

// Helper function
function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

// Mock function
async function fetchPosts(query: any): Promise<Post[]> {
    return [];
}
