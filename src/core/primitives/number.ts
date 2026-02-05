// NumberSchema - validation for number types

import { Schema } from '../schema.js';
import { ParseContext } from '../parse-context.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { ParseResult } from '../../types/validation-result.js';
import { INVALID } from '../../types/validation-result.js';

interface NumberConstraint {
    value?: number;
    message?: string;
}

interface NumberConstraints {
    min?: NumberConstraint;
    max?: NumberConstraint;
    int?: { message?: string };
    positive?: { message?: string };
    negative?: { message?: string };
    finite?: { message?: string };
}

/**
 * Schema for validating number values
 */
export class NumberSchema extends Schema<number, number> {
    private constraints: NumberConstraints = {};

    _parse(input: unknown, ctx: ParseContext): ParseResult<number> {
        // Type check
        if (typeof input !== 'number') {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected number',
                { expected: 'number', received: typeof input }
            );
            return INVALID;
        }

        // Check for NaN
        if (Number.isNaN(input)) {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected number, received NaN',
                { expected: 'number', received: 'NaN' }
            );
            return INVALID;
        }

        // Finite constraint (must come before min/max since Infinity would pass those)
        if (this.constraints.finite) {
            if (!Number.isFinite(input)) {
                const defaultMessage = 'Number must be finite';
                // Per-schema message overrides global template
                if (this.constraints.finite.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.finite.message,
                        code: ErrorCodes.NUMBER_FINITE,
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_FINITE,
                        defaultMessage
                    );
                }
                return INVALID;
            }
        }

        // Min constraint
        if (this.constraints.min && this.constraints.min.value !== undefined) {
            if (input < this.constraints.min.value) {
                const defaultMessage = `Number must be at least ${this.constraints.min.value}`;
                // Per-schema message overrides global template
                if (this.constraints.min.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.min.message,
                        code: ErrorCodes.NUMBER_MIN,
                        meta: { min: this.constraints.min.value, actual: input },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_MIN,
                        defaultMessage,
                        { min: this.constraints.min.value, actual: input }
                    );
                }
                return INVALID;
            }
        }

        // Max constraint
        if (this.constraints.max && this.constraints.max.value !== undefined) {
            if (input > this.constraints.max.value) {
                const defaultMessage = `Number must be at most ${this.constraints.max.value}`;
                // Per-schema message overrides global template
                if (this.constraints.max.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.max.message,
                        code: ErrorCodes.NUMBER_MAX,
                        meta: { max: this.constraints.max.value, actual: input },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_MAX,
                        defaultMessage,
                        { max: this.constraints.max.value, actual: input }
                    );
                }
                return INVALID;
            }
        }

        // Integer constraint
        if (this.constraints.int) {
            if (!Number.isInteger(input)) {
                const defaultMessage = 'Number must be an integer';
                // Per-schema message overrides global template
                if (this.constraints.int.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.int.message,
                        code: ErrorCodes.NUMBER_INT,
                        meta: { actual: input },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_INT,
                        defaultMessage,
                        { actual: input }
                    );
                }
                return INVALID;
            }
        }

        // Positive constraint
        if (this.constraints.positive) {
            if (input <= 0) {
                const defaultMessage = 'Number must be positive';
                // Per-schema message overrides global template
                if (this.constraints.positive.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.positive.message,
                        code: ErrorCodes.NUMBER_POSITIVE,
                        meta: { actual: input },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_POSITIVE,
                        defaultMessage,
                        { actual: input }
                    );
                }
                return INVALID;
            }
        }

        // Negative constraint
        if (this.constraints.negative) {
            if (input >= 0) {
                const defaultMessage = 'Number must be negative';
                // Per-schema message overrides global template
                if (this.constraints.negative.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.negative.message,
                        code: ErrorCodes.NUMBER_NEGATIVE,
                        meta: { actual: input },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.NUMBER_NEGATIVE,
                        defaultMessage,
                        { actual: input }
                    );
                }
                return INVALID;
            }
        }

        return input;
    }

    /**
     * Set minimum value constraint
     */
    min(value: number, message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, min: { value, message } };
        return schema;
    }

    /**
     * Set maximum value constraint
     */
    max(value: number, message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, max: { value, message } };
        return schema;
    }

    /**
     * Require integer values
     */
    int(message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, int: { message } };
        return schema;
    }

    /**
     * Require positive values (> 0)
     */
    positive(message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, positive: { message } };
        return schema;
    }

    /**
     * Require negative values (< 0)
     */
    negative(message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, negative: { message } };
        return schema;
    }

    /**
     * Require finite values (not Infinity or -Infinity)
     */
    finite(message?: string): NumberSchema {
        const schema = new NumberSchema();
        schema.constraints = { ...this.constraints, finite: { message } };
        return schema;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const schema: Record<string, any> = {
            type: this.constraints.int ? 'integer' : 'number',
        };

        // Add constraints
        if (this.constraints.min && this.constraints.min.value !== undefined) {
            schema.minimum = this.constraints.min.value;
        }
        if (this.constraints.max && this.constraints.max.value !== undefined) {
            schema.maximum = this.constraints.max.value;
        }

        return schema;
    }
}

/**
 * Factory function to create a NumberSchema
 */
export function number(): NumberSchema {
    return new NumberSchema();
}

/**
 * StringToIntSchema - parses a string to an integer
 */
class StringToIntSchema extends Schema<string, number> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<number> {
        if (typeof input !== 'string') {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Expected string for parseInt',
                code: ErrorCodes.INVALID_TYPE,
                meta: { expected: 'string', received: typeof input },
            });
            return INVALID;
        }

        const parsed = Number.parseInt(input, 10);
        if (Number.isNaN(parsed)) {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Failed to parse string as integer',
                code: 'number.parse_int',
            });
            return INVALID;
        }

        return parsed;
    }
}

/**
 * StringToFloatSchema - parses a string to a float
 */
class StringToFloatSchema extends Schema<string, number> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<number> {
        if (typeof input !== 'string') {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Expected string for parseFloat',
                code: ErrorCodes.INVALID_TYPE,
                meta: { expected: 'string', received: typeof input },
            });
            return INVALID;
        }

        const parsed = Number.parseFloat(input);
        if (Number.isNaN(parsed)) {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Failed to parse string as float',
                code: 'number.parse_float',
            });
            return INVALID;
        }

        return parsed;
    }
}

/**
 * Factory function to create a schema that parses strings to integers
 */
export function parseInt(): StringToIntSchema {
    return new StringToIntSchema();
}

/**
 * Factory function to create a schema that parses strings to floats
 */
export function parseFloat(): StringToFloatSchema {
    return new StringToFloatSchema();
}
