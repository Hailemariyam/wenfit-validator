// NestJS adapter for Wenfit Validator
// Provides pipes, guards, decorators, and interceptors for NestJS validation

import type { Schema } from '../core/schema.js';
import type { ValidationErrorData } from '../errors/validation-error.js';

/**
 * NestJS types (minimal definitions to avoid requiring @nestjs/common)
 */
interface PipeTransform<T = any, R = any> {
    transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

interface ArgumentMetadata {
    type: 'body' | 'query' | 'param' | 'custom';
    metatype?: any;
    data?: string;
}

interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

interface ExecutionContext {
    switchToHttp(): {
        getRequest(): any;
        getResponse(): any;
    };
    [key: string]: any;
}

interface ExceptionFilter<T = any> {
    catch(exception: T, host: ArgumentsHost): any;
}

interface ArgumentsHost {
    switchToHttp(): {
        getRequest(): any;
        getResponse(): any;
    };
    [key: string]: any;
}

/**
 * NestJS validation pipe that uses Wenfit schemas
 * Validates incoming data and transforms it according to the schema
 *
 * @example
 * ```typescript
 * import { ValidationPipe } from 'wenfit-validator/adapters/nestjs';
 * import { object, string, number } from 'wenfit-validator';
 *
 * const createUserSchema = object({
 *   name: string().min(1),
 *   email: string().email(),
 *   age: number().min(18)
 * });
 *
 * @Controller('users')
 * export class UsersController {
 *   @Post()
 *   create(@Body(new ValidationPipe(createUserSchema)) data: any) {
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

        // If validation fails, throw BadRequestException
        if (!result.success) {
            // Dynamically require @nestjs/common to avoid hard dependency
            try {
                const { BadRequestException } = require('@nestjs/common');
                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: result.errors,
                });
            } catch (err) {
                // Fallback if @nestjs/common is not available
                const error: any = new Error('Validation failed');
                error.status = 400;
                error.errors = result.errors;
                throw error;
            }
        }

        // Return validated and transformed data
        return result.data;
    }
}

/**
 * Specialized pipe for validating request body
 * Provides clearer error messages for body validation
 *
 * @example
 * ```typescript
 * import { BodyValidationPipe } from 'wenfit-validator/adapters/nestjs';
 *
 * @Post()
 * create(@Body(new BodyValidationPipe(schema)) data: any) {
 *   return data;
 * }
 * ```
 */
export class BodyValidationPipe implements PipeTransform {
    constructor(private schema: Schema<any, any>) { }

    async transform(value: any, _metadata: ArgumentMetadata): Promise<any> {
        const result = await Promise.resolve(this.schema.safeParse(value));

        if (!result.success) {
            try {
                const { BadRequestException } = require('@nestjs/common');
                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Request body validation failed',
                    errors: result.errors,
                });
            } catch (err) {
                const error: any = new Error('Request body validation failed');
                error.status = 400;
                error.errors = result.errors;
                throw error;
            }
        }

        return result.data;
    }
}

/**
 * Specialized pipe for validating query parameters
 * Provides clearer error messages for query validation
 *
 * @example
 * ```typescript
 * import { QueryValidationPipe } from 'wenfit-validator/adapters/nestjs';
 *
 * @Get()
 * findAll(@Query(new QueryValidationPipe(schema)) query: any) {
 *   return query;
 * }
 * ```
 */
export class QueryValidationPipe implements PipeTransform {
    constructor(private schema: Schema<any, any>) { }

    async transform(value: any, _metadata: ArgumentMetadata): Promise<any> {
        const result = await Promise.resolve(this.schema.safeParse(value));

        if (!result.success) {
            try {
                const { BadRequestException } = require('@nestjs/common');
                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Query parameters validation failed',
                    errors: result.errors,
                });
            } catch (err) {
                const error: any = new Error('Query parameters validation failed');
                error.status = 400;
                error.errors = result.errors;
                throw error;
            }
        }

        return result.data;
    }
}

/**
 * Specialized pipe for validating route parameters
 * Provides clearer error messages for param validation
 *
 * @example
 * ```typescript
 * import { ParamValidationPipe } from 'wenfit-validator/adapters/nestjs';
 *
 * @Get(':id')
 * findOne(@Param('id', new ParamValidationPipe(schema)) id: string) {
 *   return { id };
 * }
 * ```
 */
export class ParamValidationPipe implements PipeTransform {
    constructor(private schema: Schema<any, any>) { }

    async transform(value: any, _metadata: ArgumentMetadata): Promise<any> {
        const result = await Promise.resolve(this.schema.safeParse(value));

        if (!result.success) {
            try {
                const { BadRequestException } = require('@nestjs/common');
                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Route parameter validation failed',
                    errors: result.errors,
                });
            } catch (err) {
                const error: any = new Error('Route parameter validation failed');
                error.status = 400;
                error.errors = result.errors;
                throw error;
            }
        }

        return result.data;
    }
}

/**
 * Options for ValidationGuard
 */
export interface ValidationGuardOptions {
    schema: Schema<any, any>;
    source?: 'body' | 'query' | 'params';
}

/**
 * NestJS guard for validating requests
 * Can validate body, query, or params and attach validated data to request
 *
 * @example
 * ```typescript
 * import { ValidationGuard } from 'wenfit-validator/adapters/nestjs';
 *
 * @Controller('users')
 * @UseGuards(new ValidationGuard({ schema: userSchema, source: 'body' }))
 * export class UsersController {
 *   @Post()
 *   create(@Req() req: Request) {
 *     // Access validated data from req.validatedBody
 *     return req.validatedBody;
 *   }
 * }
 * ```
 */
export class ValidationGuard implements CanActivate {
    private schema: Schema<any, any>;
    private source: 'body' | 'query' | 'params';

    constructor(options: ValidationGuardOptions | Schema<any, any>, source: 'body' | 'query' | 'params' = 'body') {
        // Support both new API (options object) and old API (schema, source)
        if ('safeParse' in options) {
            this.schema = options;
            this.source = source;
        } else {
            this.schema = options.schema;
            this.source = options.source || 'body';
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const data = request[this.source];

        // Validate the data
        const result = await Promise.resolve(this.schema.safeParse(data));

        if (!result.success) {
            try {
                const { BadRequestException } = require('@nestjs/common');
                throw new BadRequestException({
                    statusCode: 400,
                    message: `Validation failed for ${this.source}`,
                    errors: result.errors,
                });
            } catch (err) {
                const error: any = new Error(`Validation failed for ${this.source}`);
                error.status = 400;
                error.errors = result.errors;
                throw error;
            }
        }

        // Attach validated data to request
        const validatedKey = `validated${this.source.charAt(0).toUpperCase() + this.source.slice(1)}`;
        request[validatedKey] = result.data;

        return true;
    }
}

/**
 * Exception filter for handling validation errors
 * Formats validation errors in a consistent way
 *
 * @example
 * ```typescript
 * import { ValidationExceptionFilter } from 'wenfit-validator/adapters/nestjs';
 *
 * @Controller('users')
 * @UseFilters(new ValidationExceptionFilter())
 * export class UsersController {
 *   // ...
 * }
 * ```
 */
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.status || 400;

        const errorResponse = {
            statusCode: status,
            message: exception.message || 'Validation failed',
            errors: exception.errors || exception.response?.errors || [],
            timestamp: new Date().toISOString(),
        };

        response.status(status).json(errorResponse);
    }
}

/**
 * Helper function to create a validation pipe
 * Convenience function for creating ValidationPipe instances
 *
 * @param schema - The Wenfit validation schema
 * @returns ValidationPipe instance
 *
 * @example
 * ```typescript
 * import { createValidationPipe } from 'wenfit-validator/adapters/nestjs';
 *
 * @Post()
 * create(@Body(createValidationPipe(schema)) data: any) {
 *   return data;
 * }
 * ```
 */
export function createValidationPipe(schema: Schema<any, any>): ValidationPipe {
    return new ValidationPipe(schema);
}

/**
 * Helper function to create a body validation pipe
 */
export function createBodyValidationPipe(schema: Schema<any, any>): BodyValidationPipe {
    return new BodyValidationPipe(schema);
}

/**
 * Helper function to create a query validation pipe
 */
export function createQueryValidationPipe(schema: Schema<any, any>): QueryValidationPipe {
    return new QueryValidationPipe(schema);
}

/**
 * Helper function to create a param validation pipe
 */
export function createParamValidationPipe(schema: Schema<any, any>): ParamValidationPipe {
    return new ParamValidationPipe(schema);
}

/**
 * Helper function to create a validation guard
 */
export function createValidationGuard(
    schema: Schema<any, any>,
    source: 'body' | 'query' | 'params' = 'body'
): ValidationGuard {
    return new ValidationGuard({ schema, source });
}

/**
 * Validate data against a schema
 * Standalone validation function for use in services or other contexts
 *
 * @param schema - The Wenfit validation schema
 * @param data - The data to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * import { validate } from 'wenfit-validator/adapters/nestjs';
 *
 * const result = await validate(userSchema, userData);
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export async function validate<T>(
    schema: Schema<any, T>,
    data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: ValidationErrorData[] }> {
    return await Promise.resolve(schema.safeParse(data));
}

// Export aliases for consistency with other adapters
export {
    ValidationPipe as WenfitValidationPipe,
    BodyValidationPipe as WenfitBodyValidationPipe,
    QueryValidationPipe as WenfitQueryValidationPipe,
    ParamValidationPipe as WenfitParamValidationPipe,
    ValidationGuard as WenfitValidationGuard,
    ValidationExceptionFilter as WenfitValidationExceptionFilter,
};
