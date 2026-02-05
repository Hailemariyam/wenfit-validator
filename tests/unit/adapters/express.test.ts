// Unit tests for Express adapter

import { describe, test, expect, vi } from 'vitest';
import {
    validate,
    validateBody,
    validateQuery,
    validateParams,
    ValidationPipe,
    ValidateBody,
    ValidateQuery,
    ValidateParams
} from '../../../src/adapters/express.js';
import { string, number, object } from '../../../src/core/index.js';
import 'reflect-metadata';

// Mock Express types
interface MockRequest {
    body?: any;
    query?: any;
    params?: any;
    validatedData?: any;
}

interface MockResponse {
    statusCode?: number;
    jsonData?: any;
    status: (code: number) => MockResponse;
    json: (data: any) => MockResponse;
}

type MockNextFunction = ReturnType<typeof vi.fn>;

function createMockRequest(data: Partial<MockRequest> = {}): MockRequest {
    return {
        body: data.body,
        query: data.query,
        params: data.params,
        ...data,
    };
}

function createMockResponse(): MockResponse {
    const res: MockResponse = {
        status: vi.fn((code: number) => {
            res.statusCode = code;
            return res;
        }),
        json: vi.fn((data: any) => {
            res.jsonData = data;
            return res;
        }),
    };
    return res;
}

describe('Express Adapter', () => {
    describe('validate middleware', () => {
        test('validation failure returns 400 with errors', async () => {
            // Requirements: 17.2
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const middleware = validate({ schema, source: 'body' });
            const req = createMockRequest({
                body: { name: 'ab', age: -5 }, // Invalid: name too short, age negative
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            // Should return 400 status
            expect(res.statusCode).toBe(400);

            // Should include validation errors
            expect(res.jsonData).toEqual({
                success: false,
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        path: ['name'],
                        code: 'string.min',
                    }),
                    expect.objectContaining({
                        path: ['age'],
                        code: 'number.min',
                    }),
                ]),
            });

            // Should not call next()
            expect(next).not.toHaveBeenCalled();
        });

        test('validation success attaches data to request', async () => {
            // Requirements: 17.3
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const middleware = validate({ schema, source: 'body' });
            const req = createMockRequest({
                body: { name: 'John', age: 25 },
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            // Should attach validated data to request
            expect(req.validatedData).toEqual({
                name: 'John',
                age: 25,
            });

            // Should call next() to continue
            expect(next).toHaveBeenCalledWith();

            // Should not send response
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test('validates request body by default', async () => {
            const schema = string().min(5);
            const middleware = validate({ schema });

            const req = createMockRequest({
                body: 'test', // Too short
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(res.statusCode).toBe(400);
            expect(res.jsonData?.success).toBe(false);
        });

        test('validates request query when source is query', async () => {
            const schema = object({
                search: string().min(1),
            });

            const middleware = validate({ schema, source: 'query' });
            const req = createMockRequest({
                query: { search: '' }, // Empty string
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(res.statusCode).toBe(400);
            expect(res.jsonData?.errors).toHaveLength(1);
        });

        test('validates request params when source is params', async () => {
            const schema = object({
                id: string().min(1),
            });

            const middleware = validate({ schema, source: 'params' });
            const req = createMockRequest({
                params: { id: '123' },
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(req.validatedData).toEqual({ id: '123' });
            expect(next).toHaveBeenCalled();
        });

        test('uses custom error handler when provided', async () => {
            const schema = string().min(5);
            const customErrorHandler = vi.fn();

            const middleware = validate({
                schema,
                source: 'body',
                onError: customErrorHandler,
            });

            const req = createMockRequest({
                body: 'test', // Too short
            });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            // Custom error handler should be called
            expect(customErrorHandler).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        code: 'string.min',
                    }),
                ]),
                req,
                res
            );

            // Default error response should not be sent
            expect(res.status).not.toHaveBeenCalled();
        });

        test('handles async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    // Simulate async check
                    return val.startsWith('valid');
                },
                'Must start with "valid"'
            );

            const middleware = validate({ schema, source: 'body' });

            // Test failure
            const req1 = createMockRequest({ body: 'invalid' });
            const res1 = createMockResponse();
            const next1 = vi.fn();

            await middleware(req1 as any, res1 as any, next1);

            expect(res1.statusCode).toBe(400);
            expect(res1.jsonData?.errors).toHaveLength(1);
            expect(res1.jsonData?.errors[0].message).toBe('Must start with "valid"');

            // Test success
            const req2 = createMockRequest({ body: 'valid-data' });
            const res2 = createMockResponse();
            const next2 = vi.fn();

            await middleware(req2 as any, res2 as any, next2);

            expect(req2.validatedData).toBe('valid-data');
            expect(next2).toHaveBeenCalled();
        });

        test('passes unexpected errors to Express error handler', async () => {
            const schema = string();
            const middleware = validate({ schema, source: 'body' });

            // Create a request that will cause an error
            const req = createMockRequest();
            // Make body a getter that throws
            Object.defineProperty(req, 'body', {
                get() {
                    throw new Error('Unexpected error');
                },
            });

            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            // Should pass error to next()
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('convenience wrappers', () => {
        test('validateBody validates request body', async () => {
            const schema = string().min(5);
            const middleware = validateBody(schema);

            const req = createMockRequest({ body: 'hello world' });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(req.validatedData).toBe('hello world');
            expect(next).toHaveBeenCalled();
        });

        test('validateQuery validates request query', async () => {
            const schema = object({ q: string() });
            const middleware = validateQuery(schema);

            const req = createMockRequest({ query: { q: 'search' } });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(req.validatedData).toEqual({ q: 'search' });
            expect(next).toHaveBeenCalled();
        });

        test('validateParams validates request params', async () => {
            const schema = object({ id: string() });
            const middleware = validateParams(schema);

            const req = createMockRequest({ params: { id: '42' } });
            const res = createMockResponse();
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(req.validatedData).toEqual({ id: '42' });
            expect(next).toHaveBeenCalled();
        });
    });
});

describe('NestJS Decorators', () => {
    describe('ValidationPipe', () => {
        test('transforms valid data', async () => {
            // Requirements: 17.4
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            const result = await pipe.transform(
                { name: 'John', age: 25 },
                metadata
            );

            expect(result).toEqual({ name: 'John', age: 25 });
        });

        test('throws error for invalid data', async () => {
            // Requirements: 17.4
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            await expect(
                pipe.transform({ name: 'ab', age: -5 }, metadata)
            ).rejects.toThrow('Validation failed');
        });

        test('error includes validation errors', async () => {
            // Requirements: 17.4
            const schema = string().min(5);
            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            try {
                await pipe.transform('test', metadata);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.status).toBe(400);
                expect(error.response.errors).toHaveLength(1);
                expect(error.response.errors[0].code).toBe('string.min');
            }
        });

        test('handles async validation', async () => {
            // Requirements: 17.4
            const schema = string().refine(
                async (val) => val.startsWith('valid'),
                'Must start with "valid"'
            );

            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            // Test failure
            await expect(
                pipe.transform('invalid', metadata)
            ).rejects.toThrow('Validation failed');

            // Test success
            const result = await pipe.transform('valid-data', metadata);
            expect(result).toBe('valid-data');
        });

        test('applies transformations', async () => {
            // Requirements: 17.4
            const schema = string().transform((val) => val.trim().toLowerCase());
            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            const result = await pipe.transform('  HELLO  ', metadata);
            expect(result).toBe('hello');
        });
    });

    describe('Decorator functions', () => {
        test('ValidateBody stores metadata', () => {
            // Requirements: 17.5
            class TestController {
                testMethod(@ValidateBody(string()) data: any) {
                    return data;
                }
            }

            const metadata = Reflect.getMetadata(
                'validation:pipes',
                TestController.prototype,
                'testMethod'
            );

            expect(metadata).toBeDefined();
            expect(metadata).toHaveLength(1);
            expect(metadata[0].index).toBe(0);
            expect(metadata[0].pipe).toBeInstanceOf(ValidationPipe);
        });

        test('ValidateQuery stores metadata', () => {
            // Requirements: 17.5
            class TestController {
                testMethod(@ValidateQuery(string()) query: any) {
                    return query;
                }
            }

            const metadata = Reflect.getMetadata(
                'validation:pipes',
                TestController.prototype,
                'testMethod'
            );

            expect(metadata).toBeDefined();
            expect(metadata).toHaveLength(1);
            expect(metadata[0].index).toBe(0);
            expect(metadata[0].pipe).toBeInstanceOf(ValidationPipe);
        });

        test('ValidateParams stores metadata', () => {
            // Requirements: 17.5
            class TestController {
                testMethod(@ValidateParams(string()) params: any) {
                    return params;
                }
            }

            const metadata = Reflect.getMetadata(
                'validation:pipes',
                TestController.prototype,
                'testMethod'
            );

            expect(metadata).toBeDefined();
            expect(metadata).toHaveLength(1);
            expect(metadata[0].index).toBe(0);
            expect(metadata[0].pipe).toBeInstanceOf(ValidationPipe);
        });

        test('multiple decorators store separate metadata', () => {
            // Requirements: 17.5
            class TestController {
                testMethod(
                    @ValidateBody(string()) body: any,
                    @ValidateQuery(string()) query: any
                ) {
                    return { body, query };
                }
            }

            const metadata = Reflect.getMetadata(
                'validation:pipes',
                TestController.prototype,
                'testMethod'
            );

            expect(metadata).toBeDefined();
            expect(metadata).toHaveLength(2);

            // Decorators are applied in reverse order, so query (index 1) is stored first
            expect(metadata[0].index).toBe(1);
            expect(metadata[1].index).toBe(0);
        });
    });
});
