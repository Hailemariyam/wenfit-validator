// Union schema - validates input against multiple possible schemas

import { Schema } from './schema.js';
import { ParseContext } from './parse-context.js';
import { ErrorCodes } from '../errors/error-codes.js';
import type { ParseResult } from '../types/validation-result.js';
import { INVALID } from '../types/validation-result.js';

/**
 * UnionSchema validates input against multiple possible schemas
 * Accepts input if ANY of the member schemas validate successfully
 */
export class UnionSchema<T extends Schema<any, any>[]> extends Schema<
    T[number] extends Schema<infer I, any> ? I : never,
    T[number] extends Schema<any, infer O> ? O : never
> {
    constructor(private readonly options: T) {
        super();
        if (options.length === 0) {
            throw new Error('Union must have at least one schema option');
        }
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<any> {
        // Try each union member schema in order
        const allErrors: Array<{ schema: Schema<any, any>; errors: any[] }> = [];

        for (const schema of this.options) {
            // Create a new context for each attempt to isolate errors
            const attemptCtx = new ParseContext();

            // Try to parse with this schema
            const result = schema._parse(input, attemptCtx);

            // If this schema succeeded, return the result
            if (!attemptCtx.hasErrors()) {
                return result;
            }

            // Collect errors from this failed attempt
            allErrors.push({
                schema,
                errors: attemptCtx.getErrors(),
            });
        }

        // All schemas failed - add error with all member failures
        ctx.addError({
            path: ctx.getCurrentPath(),
            message: `Input did not match any union member`,
            code: ErrorCodes.UNION_INVALID,
            meta: {
                unionErrors: allErrors.map(({ errors }) => errors),
            },
        });

        return INVALID;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        return {
            anyOf: this.options.map(schema => schema.toJSONSchema()),
        };
    }
}

/**
 * Factory function to create a union schema
 */
export function union<T extends [Schema<any, any>, ...Schema<any, any>[]]>(
    options: T
): UnionSchema<T> {
    return new UnionSchema(options);
}

// Type inference helper
export type InferUnion<T extends Schema<any, any>[]> = T[number] extends Schema<any, infer O>
    ? O
    : never;
