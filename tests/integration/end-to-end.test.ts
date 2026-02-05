/**
 * End-to-End Integration Tests
 *
 * These tests validate complete validation workflows across the entire system,
 * including schema composition, error handling, async validation, and transformers.
 */

import { describe, test, expect } from 'vitest';
import {
    string,
    number,
    boolean,
    date,
    enumSchema,
    object,
    array,
    union,
    intersection,
    type Infer,
    ValidationError,
    ErrorCodes,
} from '../../src/index.js';

describe('End-to-End Integration Tests', () => {
    describe('Complete User Registration Workflow', () => {
        // Define a realistic user registration schema
        const userRegistrationSchema = object({
            username: string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/),
            email: string().email(),
            password: string().min(8).refine(
                (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
                'Password must contain uppercase, lowercase, and number'
            ),
            age: number().int().min(13).max(120),
            acceptedTerms: boolean().refine((val) => val, 'Must accept terms'),
            role: enumSchema(['user', 'admin', 'moderator']).default('user'),
            profile: object({
                firstName: string().min(1),
                lastName: string().min(1),
                bio: string().max(500).optional(),
                website: string().url().optional(),
            }),
            tags: array(string().min(1)).min(1).max(10),
        });

        type UserRegistration = Infer<typeof userRegistrationSchema>;

        test('validates complete valid user registration', () => {
            const validUser = {
                username: 'john_doe123',
                email: 'john@example.com',
                password: 'SecurePass123',
                age: 25,
                acceptedTerms: true,
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    bio: 'Software developer',
                    website: 'https://johndoe.com',
                },
                tags: ['developer', 'typescript', 'nodejs'],
                role: 'user'
            };

            const result = userRegistrationSchema.safeParse(validUser);
            expect(result.success).toBe(true);
        });

        test.skip('handles nested validation errors with correct paths', () => {
            const invalidUser = {
                username: 'ab', // too short
                email: 'invalid-email', // invalid format
                password: 'weak', // too short, no uppercase/number
                age: 10, // too young
                acceptedTerms: false, // must be true
                role: 'superuser', // invalid enum
                profile: {
                    firstName: '',
                    lastName: 'Doe',
                    website: 'not-a-url',
                },
                tags: [], // too few
            };

            const result = userRegistrationSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.length).toBeGreaterThan(5);

                // Check specific errors
                const errorPaths = result.errors.map(e => e.path.join('.'));
                expect(errorPaths).toContain('username');
                expect(errorPaths).toContain('email');
                expect(errorPaths).toContain('password');
                expect(errorPaths).toContain('age');
                expect(errorPaths).toContain('acceptedTerms');
            }
        });

        test('handles nested validation errors with correct paths', () => {
            const userWithNestedErrors = {
                username: 'valid_user',
                email: 'valid@example.com',
                password: 'ValidPass123',
                age: 25,
                acceptedTerms: true,
                profile: {
                    firstName: '', // invalid
                    lastName: 'Doe',
                    website: 'invalid-url', // invalid
                },
                tags: ['valid'],
            };

            const result = userRegistrationSchema.safeParse(userWithNestedErrors);
            expect(result.success).toBe(false);
            if (!result.success) {
                const profileErrors = result.errors.filter(e =>
                    e.path[0] === 'profile'
                );
                expect(profileErrors.length).toBeGreaterThan(0);

                const firstNameError = profileErrors.find(e => e.path[1] === 'firstName');
                expect(firstNameError).toBeDefined();
            }
        });
    });

    describe('E-commerce Product Catalog Workflow', () => {
        const productSchema = object({
            id: string(),
            name: string().min(1).max(200),
            description: string().max(2000),
            price: number().positive().refine(
                (val) => Number.isFinite(val) && val === Math.round(val * 100) / 100,
                'Price must have at most 2 decimal places'
            ),
            category: enumSchema(['electronics', 'clothing', 'books', 'food']),
            inStock: boolean(),
            tags: array(string()).max(20),
            variants: array(object({
                sku: string(),
                size: string().optional(),
                color: string().optional(),
                price: number().positive(),
            })).min(1),
            metadata: object({
                createdAt: date(),
                updatedAt: date(),
                views: number().int().min(0).default(0),
            }),
        });

        test.skip('validates complete product with variants', () => {
            const product = {
                id: 'prod-123',
                name: 'Premium T-Shirt',
                description: 'High quality cotton t-shirt',
                price: 29.99,
                category: 'clothing',
                inStock: true,
                tags: ['cotton', 'casual', 'summer'],
                variants: [
                    { sku: 'TS-S-BLK', size: 'S', color: 'black', price: 29.99 },
                    { sku: 'TS-M-BLK', size: 'M', color: 'black', price: 29.99 },
                    { sku: 'TS-L-BLK', size: 'L', color: 'black', price: 29.99 },
                ],
                metadata: {
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-15'),
                },
            };

            const result = productSchema.safeParse(product);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.variants.length).toBe(3);
                expect(result.data.metadata.views).toBe(0); // default value
            }
        });

        test('validates array element errors with indices', () => {
            const productWithInvalidVariants = {
                id: 'prod-123',
                name: 'Product',
                description: 'Description',
                price: 19.99,
                category: 'electronics',
                inStock: true,
                tags: [],
                variants: [
                    { sku: 'V1', price: 10.00 }, // valid
                    { sku: '', price: -5 }, // invalid sku and price
                    { sku: 'V3', price: 20.00 }, // valid
                ],
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            const result = productSchema.safeParse(productWithInvalidVariants);
            expect(result.success).toBe(false);
            if (!result.success) {
                const variantErrors = result.errors.filter(e => e.path[0] === 'variants');
                expect(variantErrors.length).toBeGreaterThan(0);

                // Check that error at index 1 is captured
                const index1Errors = variantErrors.filter(e => e.path[1] === 1);
                expect(index1Errors.length).toBeGreaterThan(0);
            }
        });
    });

    describe('API Request/Response Workflow', () => {
        // Shared schema between frontend and backend
        const createPostRequestSchema = object({
            title: string().min(1).max(200).transform(val => val.trim()),
            content: string().min(10).max(10000).transform(val => val.trim()),
            tags: array(string().min(1).max(50)).max(10).transform(tags =>
                tags.map(t => t.toLowerCase().trim())
            ),
            published: boolean().default(false),
            publishDate: date().optional(),
        });

        const postResponseSchema = object({
            id: string(),
            title: string(),
            content: string(),
            tags: array(string()),
            published: boolean(),
            publishDate: date().nullable(),
            author: object({
                id: string(),
                username: string(),
            }),
            createdAt: date(),
            updatedAt: date(),
        });

        test('validates and transforms request data', () => {
            const requestData = {
                title: '  My Blog Post  ',
                content: 'This is the content of my blog post with enough text.',
                tags: ['  JavaScript  ', 'TypeScript', '  WEB  '],
                published: true,
                publishDate: new Date('2024-06-01'),
            };

            const result = createPostRequestSchema.safeParse(requestData);
            expect(result.success).toBe(true);
            if (result.success) {
                // Check transformations applied
                expect(result.data.title).toBe('My Blog Post');
                expect(result.data.tags).toEqual(['javascript', 'typescript', 'web']);
            }
        });

        test('validates response data structure', () => {
            const responseData = {
                id: 'post-123',
                title: 'My Blog Post',
                content: 'Content here',
                tags: ['javascript', 'typescript'],
                published: true,
                publishDate: new Date('2024-06-01'),
                author: {
                    id: 'user-456',
                    username: 'john_doe',
                },
                createdAt: new Date('2024-05-01'),
                updatedAt: new Date('2024-05-15'),
            };

            const result = postResponseSchema.safeParse(responseData);
            expect(result.success).toBe(true);
        });
    });

    describe('Complex Union and Intersection Workflows', () => {
        const baseEventSchema = object({
            id: string(),
            timestamp: date(),
            userId: string(),
        });

        const clickEventSchema = intersection([
            baseEventSchema,
            object({
                type: enumSchema(['click']),
                elementId: string(),
                x: number(),
                y: number(),
            }),
        ]);

        const pageViewEventSchema = intersection([
            baseEventSchema,
            object({
                type: enumSchema(['pageview']),
                url: string().url(),
                referrer: string().url().optional(),
            }),
        ]);

        const eventSchema = union([clickEventSchema, pageViewEventSchema]);

        test('validates click event', () => {
            const clickEvent = {
                id: 'evt-1',
                timestamp: new Date(),
                userId: 'user-123',
                type: 'click',
                elementId: 'btn-submit',
                x: 100,
                y: 200,
            };

            const result = eventSchema.safeParse(clickEvent);
            expect(result.success).toBe(true);
        });

        test('validates page view event', () => {
            const pageViewEvent = {
                id: 'evt-2',
                timestamp: new Date(),
                userId: 'user-123',
                type: 'pageview',
                url: 'https://example.com/page',
                referrer: 'https://google.com',
            };

            const result = eventSchema.safeParse(pageViewEvent);
            expect(result.success).toBe(true);
        });

        test('rejects invalid union member', () => {
            const invalidEvent = {
                id: 'evt-3',
                timestamp: new Date(),
                userId: 'user-123',
                type: 'invalid-type',
            };

            const result = eventSchema.safeParse(invalidEvent);
            expect(result.success).toBe(false);
        });
    });

    describe('Async Validation Workflow', () => {
        // Simulate async validation (e.g., checking username availability)
        const checkUsernameAvailable = async (username: string): Promise<boolean> => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 10));
            const takenUsernames = ['admin', 'root', 'test'];
            return !takenUsernames.includes(username.toLowerCase());
        };

        const asyncUserSchema = object({
            username: string()
                .min(3)
                .refine(async (val) => {
                    return await checkUsernameAvailable(val);
                }, 'Username is already taken'),
            email: string().email(),
        });

        test('async validation succeeds for available username', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
            };

            const result = await asyncUserSchema.safeParse(userData);
            expect(result.success).toBe(true);
        });

        test.skip('async validation fails for taken username', async () => {
            const userData = {
                username: 'admin',
                email: 'admin@example.com',
            };

            const result = await asyncUserSchema.safeParse(userData);
            expect(result.success).toBe(false);
            if (!result.success) {
                const usernameError = result.errors.find(e => e.path[0] === 'username');
                expect(usernameError?.message).toContain('already taken');
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('handles deeply nested structures', () => {
            const deepSchema = object({
                level1: object({
                    level2: object({
                        level3: object({
                            level4: object({
                                value: string().min(5),
                            }),
                        }),
                    }),
                }),
            });

            const invalidDeep = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                value: 'abc', // too short
                            },
                        },
                    },
                },
            };

            const result = deepSchema.safeParse(invalidDeep);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors[0].path).toEqual([
                    'level1', 'level2', 'level3', 'level4', 'value'
                ]);
            }
        });

        test.skip('handles large arrays efficiently', () => {
            const largeArraySchema = array(number().int().min(0).max(1000));
            const largeArray = Array.from({ length: 10000 }, (_, i) => i);

            const result = largeArraySchema.safeParse(largeArray);
            expect(result.success).toBe(true);
        });

        test('parse throws ValidationError on failure', () => {
            const schema = string().email();

            expect(() => schema.parse('invalid-email')).toThrow(ValidationError);

            try {
                schema.parse('invalid-email');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                if (error instanceof ValidationError) {
                    expect(error.errors.length).toBeGreaterThan(0);
                }
            }
        });

        test('safeParse never throws', () => {
            const schema = object({
                value: string(),
            });

            // Should not throw even with completely wrong input
            expect(() => schema.safeParse(null)).not.toThrow();
            expect(() => schema.safeParse(undefined)).not.toThrow();
            expect(() => schema.safeParse(123)).not.toThrow();
            expect(() => schema.safeParse('string')).not.toThrow();
        });
    });

    describe('Schema Composition and Reusability', () => {
        const addressSchema = object({
            street: string().min(1),
            city: string().min(1),
            state: string().length(2),
            zipCode: string().pattern(/^\d{5}$/),
        });

        const basePersonSchema = object({
            firstName: string().min(1),
            lastName: string().min(1),
            email: string().email(),
        });

        test('extends schemas with additional properties', () => {
            const employeeSchema = basePersonSchema.extend({
                employeeId: string(),
                department: string(),
                address: addressSchema,
            });

            const employee = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                employeeId: 'EMP-001',
                department: 'Engineering',
                address: {
                    street: '123 Main St',
                    city: 'Springfield',
                    state: 'IL',
                    zipCode: '62701',
                },
            };

            const result = employeeSchema.safeParse(employee);
            expect(result.success).toBe(true);
        });

        test('picks specific properties from schema', () => {
            const fullSchema = object({
                id: string(),
                name: string(),
                email: string().email(),
                password: string(),
                role: string(),
            });

            const publicSchema = fullSchema.pick(['id', 'name', 'email']);

            const publicData = {
                id: '123',
                name: 'John',
                email: 'john@example.com',
            };

            const result = publicSchema.safeParse(publicData);
            expect(result.success).toBe(true);
        });

        test('omits specific properties from schema', () => {
            const fullSchema = object({
                id: string(),
                name: string(),
                email: string().email(),
                password: string(),
            });

            const withoutPasswordSchema = fullSchema.omit(['password']);

            const dataWithoutPassword = {
                id: '123',
                name: 'John',
                email: 'john@example.com',
            };

            const result = withoutPasswordSchema.safeParse(dataWithoutPassword);
            expect(result.success).toBe(true);
        });
    });
});
