// BooleanSchema - validation for boolean types

import { Schema } from '../schema.js';
import { ParseContext } from '../parse-context.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { ParseResult } from '../../types/validation-result.js';
import { INVALID } from '../../types/validation-result.js';

/**
 * Schema for validating boolean values
 */
export class BooleanSchema extends Schema<boolean, boolean> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<boolean> {
        // Type check
        if (typeof input !== 'boolean') {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected boolean',
                { expected: 'boolean', received: typeof input }
            );
            return INVALID;
        }

        return input;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        return {
            type: 'boolean',
        };
    }
}

/**
 * Factory function to create a BooleanSchema
 */
export function boolean(): BooleanSchema {
    return new BooleanSchema();
}
