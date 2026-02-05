// EnumSchema - validation for enum types

import { Schema } from '../schema.js';
import { ParseContext } from '../parse-context.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { ParseResult } from '../../types/validation-result.js';
import { INVALID } from '../../types/validation-result.js';

/**
 * Schema for validating enum values
 * Accepts a predefined set of allowed values
 */
export class EnumSchema<T extends readonly [string | number, ...(string | number)[]]> extends Schema<T[number], T[number]> {
    constructor(private allowedValues: T) {
        super();
    }

    _parse(input: unknown, ctx: ParseContext): ParseResult<T[number]> {
        // Check if input matches one of the allowed values
        if (!this.allowedValues.includes(input as T[number])) {
            const defaultMessage = `Invalid enum value. Expected one of: ${this.allowedValues.join(', ')}`;
            ctx.addErrorWithTemplate(
                ErrorCodes.ENUM_INVALID,
                defaultMessage,
                {
                    allowedValues: [...this.allowedValues],
                    received: input
                }
            );
            return INVALID;
        }

        return input as T[number];
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        // Determine if all values are strings or numbers
        const allStrings = this.allowedValues.every(v => typeof v === 'string');
        const allNumbers = this.allowedValues.every(v => typeof v === 'number');

        const schema: Record<string, any> = {
            enum: [...this.allowedValues],
        };

        // Add type hint if all values are of the same type
        if (allStrings) {
            schema.type = 'string';
        } else if (allNumbers) {
            schema.type = 'number';
        }

        return schema;
    }
}

/**
 * Factory function to create an EnumSchema
 * @param values - Array of allowed enum values (must have at least one value)
 */
export function enumSchema<T extends readonly [string | number, ...(string | number)[]]>(values: T): EnumSchema<T> {
    return new EnumSchema(values);
}
