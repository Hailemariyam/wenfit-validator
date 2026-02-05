// Express/NestJS adapter for Wenfit Validator

import type { Schema } from '../core/schema.js';
import type { ValidationErrorData } from '../errors/validation-error.js';

/**
 * Express Request, Response, NextFunction types
 * Using minimal type definitions to avoid requiring @types/express
 */
interface Request {
    body?: any;
    query?: any;
    params?: any;
    validatedData?: any;
    [key: string]: any;
}

interface Response {
    status(code: number): Response;
    json(data: any): Response;
    [key: string]: any;
}

type NextFunction = (err?: any) => void;

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Options for Express validation middleware
 */
export interface ValidateOptions {
    /** Schema to validate against */
    schema: Schema<any, any>;
    /** Source of data to validate (default: 'body') */
    source?: 'body' | 'query' | 'params';
    /** Custom error handler (optional) */
    onError?: (errors: ValidationErrorData[], req: Request, res: Response) => void;
}

/**
 * Create Express middleware for request validation
 *
 * @param options - Validation options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import { validate } from 'wenfit-validator/adapters/express';
 * import { object, string, number } from 'wenfit-validator';
 *
 * const userSchema = object({
 *   name: string().min(1),
 *   age: number().min(0)
 * });
 *
 * app.post('/users', validate({ schema: userSchema }), (req, res) => {
 *   // req.validatedData contains validated data
 *   const user = req.validatedData;
 *   res.json({ success: true, user });
 * });
 * ```
 */
export function validate(options: ValidateOptions): RequestHandler {
    const { schema, source = 'body', onError } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get data from the specified source
            const data = req[source];

            // Validate the data
            const result = await Promise.resolve(schema.safeParse(data));

            // Check if validation failed
            if (!result.success) {
                // Use custom error handler if provided
                if (onError) {
                    onError(result.errors, req, res);
                    return;
                }

                // Default error response: 400 with validation errors
                res.status(400).json({
                    success: false,
                    errors: result.errors,
                });
                return;
            }

            // Validation succeeded - attach validated data to request
            req.validatedData = result.data;

            // Continue to next middleware
            next();
        } catch (error) {
            // Pass unexpected errors to Express error handler
            next(error);
        }
    };
}

/**
 * Validate request body
 * Convenience wrapper for validate({ schema, source: 'body' })
 */
export function validateBody(schema: Schema<any, any>): RequestHandler {
    return validate({ schema, source: 'body' });
}

/**
 * Validate request query parameters
 * Convenience wrapper for validate({ schema, source: 'query' })
 */
export function validateQuery(schema: Schema<any, any>): RequestHandler {
    return validate({ schema, source: 'query' });
}

/**
 * Validate request route parameters
 * Convenience wrapper for validate({ schema, source: 'params' })
 */
export function validateParams(schema: Schema<any, any>): RequestHandler {
    return validate({ schema, source: 'params' });
}

// ============================================================================
// NestJS Decorators
// ============================================================================

/**
 * NestJS-compatible types
 * Using minimal type definitions to avoid requiring @nestjs/common
 */
// Note: These types are defined for documentation but not used in the implementation
// They would be used if implementing full NestJS guard/interceptor functionality
// interface ExecutionContext {
//     switchToHttp(): {
//         getRequest(): any;
//         getResponse(): any;
//     };
//     [key: string]: any;
// }

// interface ArgumentsHost {
//     switchToHttp(): {
//         getRequest(): any;
//         getResponse(): any;
//     };
//     [key: string]: any;
// }

interface PipeTransform<T = any, R = any> {
    transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

interface ArgumentMetadata {
    type: 'body' | 'query' | 'param' | 'custom';
    metatype?: any;
    data?: string;
}

/**
 * NestJS validation pipe that uses Wenfit schemas
 *
 * @example
 * ```typescript
 * import { ValidationPipe } from 'wenfit-validator/adapters/express';
 * import { object, string } from 'wenfit-validator';
 *
 * const userSchema = object({
 *   name: string().min(1),
 *   email: string().email()
 * });
 *
 * @Controller('users')
 * export class UsersController {
 *   @Post()
 *   create(@Body(new ValidationPipe(userSchema)) data: any) {
 *     return { success: true, user: data };
 *   }
 * }
 * ```
 */
export class ValidationPipe implements PipeTransform {
    constructor(private schema: Schema<any, any>) { }

    async transform(value: any, _metadata: ArgumentMetadata): Promise<any> {
        // Validate the value using the schema
        const result = await Promise.resolve(this.schema.safeParse(value));

        // If validation fails, throw an error
        if (!result.success) {
            // Create a NestJS-compatible error
            const error: any = new Error('Validation failed');
            error.name = 'BadRequestException';
            error.status = 400;
            error.response = {
                statusCode: 400,
                message: 'Validation failed',
                errors: result.errors,
            };
            throw error;
        }

        // Return validated data
        return result.data;
    }
}

/**
 * Decorator factory for validating request body in NestJS
 *
 * @param schema - Schema to validate against
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * import { ValidateBody } from 'wenfit-validator/adapters/express';
 * import { object, string } from 'wenfit-validator';
 *
 * const userSchema = object({
 *   name: string().min(1),
 *   email: string().email()
 * });
 *
 * @Controller('users')
 * export class UsersController {
 *   @Post()
 *   create(@ValidateBody(userSchema) data: any) {
 *     return { success: true, user: data };
 *   }
 * }
 * ```
 */
export function ValidateBody(schema: Schema<any, any>): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        // Store validation metadata (requires reflect-metadata package)
        if (typeof Reflect !== 'undefined' && 'defineMetadata' in Reflect) {
            const existingMetadata = (Reflect as any).getMetadata('validation:pipes', target, propertyKey!) || [];
            existingMetadata.push({
                index: parameterIndex,
                pipe: new ValidationPipe(schema),
            });
            (Reflect as any).defineMetadata('validation:pipes', existingMetadata, target, propertyKey!);
        }
    };
}

/**
 * Decorator factory for validating request query parameters in NestJS
 *
 * @param schema - Schema to validate against
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * import { ValidateQuery } from 'wenfit-validator/adapters/express';
 * import { object, string } from 'wenfit-validator';
 *
 * const querySchema = object({
 *   search: string().optional(),
 *   page: number().min(1).default(1)
 * });
 *
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   findAll(@ValidateQuery(querySchema) query: any) {
 *     return { users: [], page: query.page };
 *   }
 * }
 * ```
 */
export function ValidateQuery(schema: Schema<any, any>): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        // Store validation metadata (requires reflect-metadata package)
        if (typeof Reflect !== 'undefined' && 'defineMetadata' in Reflect) {
            const existingMetadata = (Reflect as any).getMetadata('validation:pipes', target, propertyKey!) || [];
            existingMetadata.push({
                index: parameterIndex,
                pipe: new ValidationPipe(schema),
            });
            (Reflect as any).defineMetadata('validation:pipes', existingMetadata, target, propertyKey!);
        }
    };
}

/**
 * Decorator factory for validating request route parameters in NestJS
 *
 * @param schema - Schema to validate against
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * import { ValidateParams } from 'wenfit-validator/adapters/express';
 * import { object, string } from 'wenfit-validator';
 *
 * const paramsSchema = object({
 *   id: string().min(1)
 * });
 *
 * @Controller('users')
 * export class UsersController {
 *   @Get(':id')
 *   findOne(@ValidateParams(paramsSchema) params: any) {
 *     return { user: { id: params.id } };
 *   }
 * }
 * ```
 */
export function ValidateParams(schema: Schema<any, any>): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        // Store validation metadata (requires reflect-metadata package)
        if (typeof Reflect !== 'undefined' && 'defineMetadata' in Reflect) {
            const existingMetadata = (Reflect as any).getMetadata('validation:pipes', target, propertyKey!) || [];
            existingMetadata.push({
                index: parameterIndex,
                pipe: new ValidationPipe(schema),
            });
            (Reflect as any).defineMetadata('validation:pipes', existingMetadata, target, propertyKey!);
        }
    };
}
