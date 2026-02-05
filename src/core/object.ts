// ObjectSchema - validation for object types with nested properties

import { Schema } from './schema.js';
import { ParseContext } from './parse-context.js';
import { ErrorCodes } from '../errors/error-codes.js';
import type { ParseResult } from '../types/validation-result.js';
import { INVALID } from '../types/validation-result.js';

/**
 * Shape definition for object schemas
 * Maps property names to their schemas
 */
export type ObjectShape = Record<string, Schema<any, any>>;

/**
 * Infer the TypeScript type from an object shape
 */
export type InferObjectShape<T extends ObjectShape> = {
    [K in keyof T]: T[K] extends Schema<any, infer O> ? O : never;
};

/**
 * Schema for validating object structures with nested properties
 */
export class ObjectSchema<TShape extends ObjectShape> extends Schema<
    InferObjectShape<TShape>,
    InferObjectShape<TShape>
> {
    private mode: 'strict' | 'passthrough' = 'passthrough';

    constructor(private shape: TShape) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<InferObjectShape<TShape>> {
        // Type check - must be an object
        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Expected object',
                code: ErrorCodes.INVALID_TYPE,
                meta: { expected: 'object', received: Array.isArray(input) ? 'array' : typeof input },
            });
            return INVALID;
        }

        // Circular reference detection
        if (ctx.hasVisited(input)) {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Circular reference detected',
                code: 'circular_reference',
            });
            return INVALID;
        }

        // Mark this object as visited
        ctx.markVisited(input);

        const inputObj = input as Record<string, unknown>;
        const result: Record<string, any> = {};
        let hasErrors = false;

        // Validate each property in the shape
        for (const key in this.shape) {
            const propertySchema = this.shape[key];
            if (!propertySchema) continue; // Skip if schema is undefined

            // Check if property exists as an own property (not inherited)
            // Use Object.hasOwn for modern environments, fallback to hasOwnProperty for older ones
            const hasProperty = Object.hasOwn
                ? Object.hasOwn(inputObj, key)
                : Object.prototype.hasOwnProperty.call(inputObj, key);

            // Check if property is missing
            if (!hasProperty) {
                ctx.pushPath(key);
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: `Required property '${key}' is missing`,
                    code: ErrorCodes.REQUIRED,
                });
                ctx.popPath();
                hasErrors = true;
                continue;
            }

            const propertyValue = inputObj[key];

            // Validate the property
            ctx.pushPath(key);
            const propertyResult = propertySchema._parse(propertyValue, ctx);
            ctx.popPath();

            // Check if property validation failed
            if (propertyResult === INVALID) {
                hasErrors = true;
            } else {
                result[key] = propertyResult;
            }
        }

        // Handle unknown properties in strict mode
        if (this.mode === 'strict') {
            const shapeKeys = new Set(Object.keys(this.shape));
            const unknownKeys = Object.keys(inputObj).filter(key => !shapeKeys.has(key));

            if (unknownKeys.length > 0) {
                ctx.addError({
                    path: ctx.getCurrentPath(),
                    message: `Unknown properties: ${unknownKeys.join(', ')}`,
                    code: ErrorCodes.UNKNOWN_KEYS,
                    meta: { unknownKeys },
                });
                hasErrors = true;
            }
        } else if (this.mode === 'passthrough') {
            // In passthrough mode, copy unknown properties to result
            for (const key in inputObj) {
                if (!(key in this.shape) && Object.prototype.hasOwnProperty.call(inputObj, key)) {
                    result[key] = inputObj[key];
                }
            }
        }

        // Unmark this object as visited (leaving its scope)
        ctx.unmarkVisited(input);

        if (hasErrors) {
            return INVALID;
        }

        return result as InferObjectShape<TShape>;
    }

    /**
     * Enable strict mode - reject unknown properties
     */
    strict(): ObjectSchema<TShape> {
        const schema = new ObjectSchema(this.shape);
        schema.mode = 'strict';
        return schema;
    }

    /**
     * Enable passthrough mode - allow unknown properties (default)
     */
    passthrough(): ObjectSchema<TShape> {
        const schema = new ObjectSchema(this.shape);
        schema.mode = 'passthrough';
        return schema;
    }

    /**
     * Pick specific properties from the object schema
     */
    pick<K extends keyof TShape>(keys: K[]): ObjectSchema<Pick<TShape, K>> {
        const newShape: any = {};
        for (const key of keys) {
            newShape[key] = this.shape[key];
        }
        const schema = new ObjectSchema(newShape);
        schema.mode = this.mode;
        return schema;
    }

    /**
     * Omit specific properties from the object schema
     */
    omit<K extends keyof TShape>(keys: K[]): ObjectSchema<Omit<TShape, K>> {
        const keysSet = new Set(keys);
        const newShape: any = {};
        for (const key in this.shape) {
            if (!keysSet.has(key as any)) {
                newShape[key] = this.shape[key];
            }
        }
        const schema = new ObjectSchema(newShape);
        schema.mode = this.mode;
        return schema;
    }

    /**
     * Extend the object schema with additional properties
     */
    extend<U extends ObjectShape>(extension: U): ObjectSchema<TShape & U> {
        const newShape = { ...this.shape, ...extension };
        const schema = new ObjectSchema(newShape);
        schema.mode = this.mode;
        return schema;
    }

    /**
     * Merge with another object schema
     */
    merge<U extends ObjectShape>(other: ObjectSchema<U>): ObjectSchema<TShape & U> {
        const newShape = { ...this.shape, ...other.shape };
        const schema = new ObjectSchema(newShape);
        schema.mode = this.mode;
        return schema;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        // Convert each property schema
        for (const key in this.shape) {
            const propertySchema = this.shape[key];
            if (propertySchema) {
                properties[key] = propertySchema.toJSONSchema();
                // All properties in the shape are required by default
                required.push(key);
            }
        }

        const schema: Record<string, any> = {
            type: 'object',
            properties,
        };

        // Add required array if there are required properties
        if (required.length > 0) {
            schema.required = required;
        }

        // Add additionalProperties based on mode
        if (this.mode === 'strict') {
            schema.additionalProperties = false;
        } else {
            schema.additionalProperties = true;
        }

        return schema;
    }
}

/**
 * Factory function to create an ObjectSchema
 */
export function object<T extends ObjectShape>(shape: T): ObjectSchema<T> {
    return new ObjectSchema(shape);
}
