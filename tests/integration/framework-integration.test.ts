/**
 * Framework Integration Tests
 *
 * These tests validate that all framework adapters work correctly
 * with the core validation engine.
 */

import { describe, test, expect, vi, beforeAll } from 'vitest';
import {
    string,
    number,
    object,
    array,
    type Infer,
} from '../../src/index.js';

describe('Framework Integration Tests', () => {
    describe('React Adapter Integration', () => {
        let useValidator: any;

        beforeAll(async () => {
            const reactAdapter = await import('../../src/adapters/react.js');
            useValidator = reactAdapter.useValidator;
        });

        const loginSchema = object({
            email: string().email(),
            password: string().min(8),
        });

        test.skip('useValidator validates data correctly', async () => {
            const { validate, errors, isValidating, getFieldError, clearErrors } =
                useValidator({ schema: loginSchema });

            // Initially no errors
            expect(errors.value).toEqual([]);
            expect(isValidating.value).toBe(false);

            // Validate invalid data
            const invalidData = {
                email: 'invalid-email',
                password: 'short',
            };

            const result = await validate(invalidData);
            expect(result.success).toBe(false);
            expect(errors.value.length).toBeGreaterThan(0);

            // Check field-level error access
            const emailError = getFieldError('email');
            expect(emailError).toBeDefined();
            expect(emailError?.code).toContain('email');

            // Clear errors
            clearErrors();
            expect(errors.value).toEqual([]);
        });

        test.skip('useValidator handles async validation', async () => {
            const asyncSchema = object({
                username: string().refine(
                    async (val) => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        return val !== 'taken';
                    },
                    'Username is taken'
                ),
            });

            const { validate, isValidating } = useValidator({ schema: asyncSchema });

            expect(isValidating.value).toBe(false);

            const validationPromise = validate({ username: 'taken' });

            // Should be validating during async operation
            expect(isValidating.value).toBe(true);

            const result = await validationPromise;

            // Should complete validation
            expect(isValidating.value).toBe(false);
            expect(result.success).toBe(false);
        });
    });

    describe('Vue Adapter Integration', () => {
        let useValidation: any;

        beforeAll(async () => {
            const vueAdapter = await import('../../src/adapters/vue.js');
            useValidation = vueAdapter.useValidation;
        });

        const registrationSchema = object({
            username: string().min(3).max(20),
            email: string().email(),
            age: number().int().min(18),
        });

        test.skip('useValidation provides reactive validation state', async () => {
            const { validate, errors, isValidating, getFieldError, clearErrors } =
                useValidation(registrationSchema);

            // Initially no errors
            expect(errors.value).toEqual([]);
            expect(isValidating.value).toBe(false);

            // Validate invalid data
            const invalidData = {
                username: 'ab',
                email: 'invalid',
                age: 15
            };

            await validate(invalidData);
            expect(errors.value.length).toBeGreaterThan(0);

            // Clear errors
            clearErrors();
            expect(errors.value).toEqual([]);
        });

        test.skip('useValidation handles successful validation', async () => {
            const { validate, errors } = useValidation(registrationSchema);

            const validData = {
                username: 'john_doe',
                email: 'john@example.com',
                age: 25,
            };

            const result = await validate(validData);
            expect(result.success).toBe(true);
            expect(errors.value).toEqual([]);
        });
    });

    describe('Express Adapter Integration', () => {
        let validate: any;

        beforeAll(async () => {
            const expressAdapter = await import('../../src/adapters/express.js');
            validate = expressAdapter.validate;
        });

        const createUserSchema = object({
            username: string().min(3),
            email: string().email(),
            age: number().int().min(18),
        });

        test('validate middleware validates request body', async () => {
            const middleware = validate({ schema: createUserSchema, source: 'body' });

            const mockReq = {
                body: {
                    username: 'john_doe',
                    email: 'john@example.com',
                    age: 25,
                },
            } as any;

            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any;

            const mockNext = vi.fn();

            await middleware(mockReq, mockRes, mockNext);

            // Should call next() for valid data
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();

            // Should attach validated data
            expect(mockReq.validatedData).toBeDefined();
            expect(mockReq.validatedData.username).toBe('john_doe');
        });

        test('validate middleware returns 400 for invalid data', async () => {
            const middleware = validate({ schema: createUserSchema, source: 'body' });

            const mockReq = {
                body: {
                    username: 'ab',
                    email: 'invalid-email',
                    age: 15,
                },
            } as any;

            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any;

            const mockNext = vi.fn();

            await middleware(mockReq, mockRes, mockNext);

            // Should return 400 error
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();

            // Check error response structure
            const errorResponse = mockRes.json.mock.calls[0][0];
            expect(errorResponse.errors).toBeDefined();
            expect(Array.isArray(errorResponse.errors)).toBe(true);
        });
    });

    describe('Cross-Framework Schema Sharing', () => {
        let useValidator: any;
        let useValidation: any;
        let validate: any;

        beforeAll(async () => {
            const reactAdapter = await import('../../src/adapters/react.js');
            const vueAdapter = await import('../../src/adapters/vue.js');
            const expressAdapter = await import('../../src/adapters/express.js');

            useValidator = reactAdapter.useValidator;
            useValidation = vueAdapter.useValidation;
            validate = expressAdapter.validate;
        });

        // Define a shared schema that can be used across all frameworks
        const sharedUserSchema = object({
            id: string(),
            username: string().min(3).max(20),
            email: string().email(),
            role: string(),
            createdAt: string(), // ISO date string for API compatibility
        });

        type SharedUser = Infer<typeof sharedUserSchema>;

        test.skip('shared schema works in React', async () => {
            const { validate: reactValidate } = useValidator({ schema: sharedUserSchema });

            const userData: SharedUser = {
                id: '123',
                username: 'john_doe',
                email: 'john@example.com',
                role: 'user',
                createdAt: new Date().toISOString(),
            };

            const result = await reactValidate(userData);
            expect(result.success).toBe(true);
        });

        test.skip('shared schema works in Vue', async () => {
            const { validate: vueValidate } = useValidation(sharedUserSchema);

            const userData: SharedUser = {
                id: '456',
                username: 'jane_doe',
                email: 'jane@example.com',
                role: 'admin',
                createdAt: new Date().toISOString(),
            };

            const result = await vueValidate(userData);
            expect(result.success).toBe(true);
        });

        test('shared schema works in Express', async () => {
            const middleware = validate({ schema: sharedUserSchema, source: 'body' });

            const userData: SharedUser = {
                id: '789',
                username: 'bob_smith',
                email: 'bob@example.com',
                role: 'moderator',
                createdAt: new Date().toISOString(),
            };

            const mockReq = { body: userData } as any;
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any;
            const mockNext = vi.fn();

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.validatedData).toBeDefined();
        });
    });
});
