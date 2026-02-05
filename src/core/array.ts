// ArraySchema - validation for array types with element constraints

import { Schema } from './schema.js';
import { ParseContext } from './parse-context.js';
import { ErrorCodes } from '../errors/error-codes.js';
import type { ParseResult } from '../types/validation-result.js';
import { INVALID } from '../types/validation-result.js';

/**
 * Infer the TypeScript type from an array element schema
 */
export type InferArray<T extends Schema<any, any>> = T extends Schema<any, infer O> ? O : never;

/**
 * Array constraint configuration
 */
interface ArrayConstraints {
    min?: { value: number; message?: string };
    max?: { value: number; message?: string };
    length?: { value: number; message?: string };
}

/**
 * Schema for validating arrays with element type constraints
 */
export class ArraySchema<T extends Schema<any, any>> extends Schema<
    Array<InferArray<T>>,
    Array<InferArray<T>>
> {
    private constraints: ArrayConstraints = {};

    constructor(private element: T) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<Array<InferArray<T>>> {
        // Type check - must be an array
        if (!Array.isArray(input)) {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected array',
                { expected: 'array', received: typeof input }
            );
            return INVALID;
        }

        const result: Array<InferArray<T>> = [];
        let hasErrors = false;

        // Validate each element
        for (let i = 0; i < input.length; i++) {
            ctx.pushPath(i);
            const elementResult = this.element._parse(input[i], ctx);
            ctx.popPath();

            // Check if element validation failed
            if (elementResult === INVALID) {
                hasErrors = true;
            } else {
                result.push(elementResult as InferArray<T>);
            }
        }

        // Check length constraints
        if (this.constraints.min !== undefined) {
            const { value, message } = this.constraints.min;
            if (input.length < value) {
                const defaultMessage = `Array must have at least ${value} elements`;
                // Per-schema message overrides global template
                if (message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message,
                        code: ErrorCodes.ARRAY_MIN,
                        meta: { min: value, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.ARRAY_MIN,
                        defaultMessage,
                        { min: value, actual: input.length }
                    );
                }
                hasErrors = true;
            }
        }

        if (this.constraints.max !== undefined) {
            const { value, message } = this.constraints.max;
            if (input.length > value) {
                const defaultMessage = `Array must have at most ${value} elements`;
                // Per-schema message overrides global template
                if (message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message,
                        code: ErrorCodes.ARRAY_MAX,
                        meta: { max: value, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.ARRAY_MAX,
                        defaultMessage,
                        { max: value, actual: input.length }
                    );
                }
                hasErrors = true;
            }
        }

        if (this.constraints.length !== undefined) {
            const { value, message } = this.constraints.length;
            if (input.length !== value) {
                const defaultMessage = `Array must have exactly ${value} elements`;
                // Per-schema message overrides global template
                if (message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message,
                        code: ErrorCodes.ARRAY_LENGTH,
                        meta: { length: value, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.ARRAY_LENGTH,
                        defaultMessage,
                        { length: value, actual: input.length }
                    );
                }
                hasErrors = true;
            }
        }

        if (hasErrors) {
            return INVALID;
        }

        return result;
    }

    /**
     * Set minimum array length
     */
    min(length: number, message?: string): ArraySchema<T> {
        const schema = new ArraySchema(this.element);
        schema.constraints = { ...this.constraints, min: { value: length, message } };
        return schema;
    }

    /**
     * Set maximum array length
     */
    max(length: number, message?: string): ArraySchema<T> {
        const schema = new ArraySchema(this.element);
        schema.constraints = { ...this.constraints, max: { value: length, message } };
        return schema;
    }

    /**
     * Set exact array length
     */
    length(length: number, message?: string): ArraySchema<T> {
        const schema = new ArraySchema(this.element);
        schema.constraints = { ...this.constraints, length: { value: length, message } };
        return schema;
    }

    /**
     * Require array to be non-empty (alias for min(1))
     */
    nonempty(message?: string): ArraySchema<T> {
        return this.min(1, message || 'Array must not be empty');
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const schema: Record<string, any> = {
            type: 'array',
            items: this.element.toJSONSchema(),
        };

        // Add constraints
        if (this.constraints.min) {
            schema.minItems = this.constraints.min.value;
        }
        if (this.constraints.max) {
            schema.maxItems = this.constraints.max.value;
        }
        if (this.constraints.length) {
            schema.minItems = this.constraints.length.value;
            schema.maxItems = this.constraints.length.value;
        }

        return schema;
    }
}

/**
 * Factory function to create an ArraySchema
 */
export function array<T extends Schema<any, any>>(element: T): ArraySchema<T> {
    return new ArraySchema(element);
}
