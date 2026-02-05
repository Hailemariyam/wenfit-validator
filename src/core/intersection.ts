// Intersection schema - validates input against all schemas

import { Schema } from './schema.js';
import { ParseContext } from './parse-context.js';
import type { ParseResult } from '../types/validation-result.js';
import { INVALID } from '../types/validation-result.js';

/**
 * Helper type to convert union to intersection
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never;

/**
 * IntersectionSchema validates input against all member schemas
 * Requires input to satisfy ALL schemas
 */
export class IntersectionSchema<T extends Schema<any, any>[]> extends Schema<
    UnionToIntersection<T[number] extends Schema<infer I, any> ? I : never>,
    UnionToIntersection<T[number] extends Schema<any, infer O> ? O : never>
> {
    constructor(private readonly schemas: T) {
        super();
        if (schemas.length === 0) {
            throw new Error('Intersection must have at least one schema');
        }
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<any> {
        let result: any = input;

        // Validate input against all member schemas
        for (const schema of this.schemas) {
            // Create a new context for each schema to collect errors
            const schemaCtx = new ParseContext();

            // Try to parse with this schema
            const schemaResult = schema._parse(input, schemaCtx);

            // If this schema failed, add its errors to the main context
            if (schemaCtx.hasErrors()) {
                // Add all errors from this schema
                for (const error of schemaCtx.getErrors()) {
                    ctx.addError(error);
                }
            } else {
                // Update result with the parsed value
                result = schemaResult;
            }
        }

        // If any schema failed, return INVALID
        if (ctx.hasErrors()) {
            return INVALID;
        }

        return result;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        return {
            allOf: this.schemas.map(schema => schema.toJSONSchema()),
        };
    }
}

/**
 * Factory function to create an intersection schema
 */
export function intersection<T extends [Schema<any, any>, ...Schema<any, any>[]]>(
    schemas: T
): IntersectionSchema<T> {
    return new IntersectionSchema(schemas);
}

// Type inference helper
export type InferIntersection<T extends Schema<any, any>[]> = UnionToIntersection<
    T[number] extends Schema<any, infer O> ? O : never
>;
