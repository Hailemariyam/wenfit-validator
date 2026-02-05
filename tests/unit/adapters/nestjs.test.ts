// Unit tests for NestJS adapter

import { describe, test, expect, vi } from 'vitest';
import {
    ValidationPipe,
    BodyValidationPipe,
    QueryValidationPipe,
    ParamValidationPipe,
    ValidationGuard,
    ValidationExceptionFilter,
    validate,
    createValidationPipe,
    createBodyValidationPipe,
    createQueryValidationPipe,
    createParamValidationPipe,
    createValidationGuard,
} from '../../../src/adapters/nestjs.js';
import { string, number, object, array } from '../../../src/core/index.js';

// Mock NestJS types
interface MockRequest {
    body?: any;
    query?: any;
    params?: any;
    validatedBody?: any;
    validatedQuery?: any;
    validatedParams?: any;
}

interface MockResponse {
    statusCode?: number;
    jsonData?: any;
    status: (code: number) => MockResponse;
    json: (data: any) => MockResponse;
}

interface MockExecutionContext {
    switchToHttp: () => {
        getRequest: () => MockRequest;
        getResponse: () => MockResponse;
    };
}

interface MockArgumentsHost {
    switchToHttp: () => {
        getRequest: () => MockRequest;
        getResponse: () => MockResponse;
    };
}

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

function createMockExecutionContext(req: MockRequest, res: MockResponse): MockExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
        }),
    };
}

function createMockArgumentsHost(req: MockRequest, res: MockResponse): MockArgumentsHost {
    return {
        switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
        }),
    };
}

describe('NestJS Adapter', () => {
    describe('ValidationPipe', () => {
        test('transforms valid data', async () => {
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
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            await expect(
                pipe.transform({ name: 'ab', age: -5 }, metadata)
            ).rejects.toThrow();
        });

        test('error includes validation errors', async () => {
            const schema = string().min(5);
            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            try {
                await pipe.transform('test', metadata);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.status).toBe(400);
                expect(error.errors).toBeDefined();
                expect(error.errors).toHaveLength(1);
                expect(error.errors[0].code).toBe('string.min');
            }
        });

        test('handles async validation', async () => {
            const schema = string().refine(
                async (val) => val.startsWith('valid'),
                'Must start with "valid"'
            );

            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            // Test failure
            await expect(
                pipe.transform('invalid', metadata)
            ).rejects.toThrow();

            // Test success
            const result = await pipe.transform('valid-data', metadata);
            expect(result).toBe('valid-data');
        });

        test('applies transformations', async () => {
            const schema = string().transform((val) => val.trim().toLowerCase());
            const pipe = new ValidationPipe(schema);
            const metadata: any = { type: 'body' };

            const result = await pipe.transform('  HELLO  ', metadata);
            expect(result).toBe('hello');
        });
    });

    describe('BodyValidationPipe', () => {
        test('validates request body with specific error message', async () => {
            const schema = object({
                username: string().min(3),
            });

            const pipe = new BodyValidationPipe(schema);
            const metadata: any = { type: 'body' };

            try {
                await pipe.transform({ username: 'ab' }, metadata);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('Request body validation failed');
            }
        });

        test('transforms valid body data', async () => {
            const schema = object({
                username: string().min(3),
            });

            const pipe = new BodyValidationPipe(schema);
            const metadata: any = { type: 'body' };

            const result = await pipe.transform({ username: 'john' }, metadata);
            expect(result).toEqual({ username: 'john' });
        });
    });

    describe('QueryValidationPipe', () => {
        test('validates query parameters with specific error message', async () => {
            const schema = object({
                page: number().int().min(1),
            });

            const pipe = new QueryValidationPipe(schema);
            const metadata: any = { type: 'query' };

            try {
                await pipe.transform({ page: 0 }, metadata);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('Query parameters validation failed');
            }
        });

        test('transforms valid query data with optional fields', async () => {
            const schema = object({
                page: number().int().min(1),
            });

            const pipe = new QueryValidationPipe(schema);
            const metadata: any = { type: 'query' };

            const result = await pipe.transform({ page: 2 }, metadata);
            expect(result).toEqual({ page: 2 });
        });
    });

    describe('ParamValidationPipe', () => {
        test('validates route parameters with specific error message', async () => {
            const schema = object({
                id: string().min(1),
            });

            const pipe = new ParamValidationPipe(schema);
            const metadata: any = { type: 'param' };

            try {
                await pipe.transform({ id: '' }, metadata);
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('Route parameter validation failed');
            }
        });

        test('transforms valid param data', async () => {
            const schema = object({
                id: string().min(1),
            });

            const pipe = new ParamValidationPipe(schema);
            const metadata: any = { type: 'param' };

            const result = await pipe.transform({ id: '123' }, metadata);
            expect(result).toEqual({ id: '123' });
        });
    });

    describe('ValidationGuard', () => {
        test('allows valid request and attaches validated data', async () => {
            const schema = object({
                name: string().min(3),
            });

            const guard = new ValidationGuard({ schema, source: 'body' });
            const req = createMockRequest({ body: { name: 'John' } });
            const res = createMockResponse();
            const context = createMockExecutionContext(req, res);

            const result = await guard.canActivate(context as any);

            expect(result).toBe(true);
            expect(req.validatedBody).toEqual({ name: 'John' });
        });

        test('throws error for invalid request', async () => {
            const schema = object({
                name: string().min(3),
            });

            const guard = new ValidationGuard({ schema, source: 'body' });
            const req = createMockRequest({ body: { name: 'ab' } });
            const res = createMockResponse();
            const context = createMockExecutionContext(req, res);

            await expect(guard.canActivate(context as any)).rejects.toThrow();
        });

        test('validates query parameters when source is query', async () => {
            const schema = object({
                search: string().min(1),
            });

            const guard = new ValidationGuard({ schema, source: 'query' });
            const req = createMockRequest({ query: { search: 'test' } });
            const res = createMockResponse();
            const context = createMockExecutionContext(req, res);

            const result = await guard.canActivate(context as any);

            expect(result).toBe(true);
            expect(req.validatedQuery).toEqual({ search: 'test' });
        });

        test('validates route params when source is params', async () => {
            const schema = object({
                id: string().min(1),
            });

            const guard = new ValidationGuard({ schema, source: 'params' });
            const req = createMockRequest({ params: { id: '123' } });
            const res = createMockResponse();
            const context = createMockExecutionContext(req, res);

            const result = await guard.canActivate(context as any);

            expect(result).toBe(true);
            expect(req.validatedParams).toEqual({ id: '123' });
        });

        test('supports legacy constructor syntax', async () => {
            const schema = object({
                name: string().min(3),
            });

            // Old syntax: new ValidationGuard(schema, 'body')
            const guard = new ValidationGuard(schema as any, 'body');
            const req = createMockRequest({ body: { name: 'John' } });
            const res = createMockResponse();
            const context = createMockExecutionContext(req, res);

            const result = await guard.canActivate(context as any);

            expect(result).toBe(true);
            expect(req.validatedBody).toEqual({ name: 'John' });
        });
    });

    describe('ValidationExceptionFilter', () => {
        test('formats validation errors correctly', () => {
            const filter = new ValidationExceptionFilter();
            const exception = {
                status: 400,
                message: 'Validation failed',
                errors: [
                    { path: ['name'], message: 'Name is required', code: 'required' },
                ],
            };

            const req = createMockRequest();
            const res = createMockResponse();
            const host = createMockArgumentsHost(req, res);

            filter.catch(exception, host as any);

            expect(res.statusCode).toBe(400);
            expect(res.jsonData).toEqual({
                statusCode: 400,
                message: 'Validation failed',
                errors: exception.errors,
                timestamp: expect.any(String),
            });
        });

        test('handles exceptions without errors array', () => {
            const filter = new ValidationExceptionFilter();
            const exception = {
                status: 400,
                message: 'Validation failed',
            };

            const req = createMockRequest();
            const res = createMockResponse();
            const host = createMockArgumentsHost(req, res);

            filter.catch(exception, host as any);

            expect(res.statusCode).toBe(400);
            expect(res.jsonData).toEqual({
                statusCode: 400,
                message: 'Validation failed',
                errors: [],
                timestamp: expect.any(String),
            });
        });
    });

    describe('validate function', () => {
        test('validates data successfully', async () => {
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const result = await validate(schema, { name: 'John', age: 25 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ name: 'John', age: 25 });
            }
        });

        test('returns errors for invalid data', async () => {
            const schema = object({
                name: string().min(3),
                age: number().min(0),
            });

            const result = await validate(schema, { name: 'ab', age: -5 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toHaveLength(2);
                expect(result.errors[0].path).toEqual(['name']);
                expect(result.errors[1].path).toEqual(['age']);
            }
        });
    });

    describe('helper functions', () => {
        test('createValidationPipe creates ValidationPipe instance', () => {
            const schema = string().min(5);
            const pipe = createValidationPipe(schema);

            expect(pipe).toBeInstanceOf(ValidationPipe);
        });

        test('createBodyValidationPipe creates BodyValidationPipe instance', () => {
            const schema = string().min(5);
            const pipe = createBodyValidationPipe(schema);

            expect(pipe).toBeInstanceOf(BodyValidationPipe);
        });

        test('createQueryValidationPipe creates QueryValidationPipe instance', () => {
            const schema = string().min(5);
            const pipe = createQueryValidationPipe(schema);

            expect(pipe).toBeInstanceOf(QueryValidationPipe);
        });

        test('createParamValidationPipe creates ParamValidationPipe instance', () => {
            const schema = string().min(5);
            const pipe = createParamValidationPipe(schema);

            expect(pipe).toBeInstanceOf(ParamValidationPipe);
        });

        test('createValidationGuard creates ValidationGuard instance', () => {
            const schema = string().min(5);
            const guard = createValidationGuard(schema, 'body');

            expect(guard).toBeInstanceOf(ValidationGuard);
        });
    });
});
