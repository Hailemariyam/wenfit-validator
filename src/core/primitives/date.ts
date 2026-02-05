// DateSchema - validation for date types

import { Schema } from '../schema.js';
import { ParseContext } from '../parse-context.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { ParseResult } from '../../types/validation-result.js';
import { INVALID } from '../../types/validation-result.js';

interface DateConstraint {
    value: Date;
    message?: string;
}

interface DateConstraints {
    min?: DateConstraint;
    max?: DateConstraint;
}

/**
 * Schema for validating Date values
 */
export class DateSchema extends Schema<Date, Date> {
    private constraints: DateConstraints = {};

    _parse(input: unknown, ctx: ParseContext): ParseResult<Date> {
        // Type check - must be a Date instance
        if (!(input instanceof Date)) {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected date',
                { expected: 'date', received: typeof input }
            );
            return INVALID;
        }

        // Check for invalid date (e.g., new Date('invalid'))
        if (isNaN(input.getTime())) {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Invalid date',
                { expected: 'date', received: 'Invalid Date' }
            );
            return INVALID;
        }

        // Min date constraint
        if (this.constraints.min) {
            if (input.getTime() < this.constraints.min.value.getTime()) {
                const defaultMessage = `Date must be at or after ${this.constraints.min.value.toISOString()}`;
                // Per-schema message overrides global template
                if (this.constraints.min.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.min.message,
                        code: ErrorCodes.DATE_MIN,
                        meta: { min: this.constraints.min.value.toISOString(), actual: input.toISOString() },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.DATE_MIN,
                        defaultMessage,
                        { min: this.constraints.min.value.toISOString(), actual: input.toISOString() }
                    );
                }
                return INVALID;
            }
        }

        // Max date constraint
        if (this.constraints.max) {
            if (input.getTime() > this.constraints.max.value.getTime()) {
                const defaultMessage = `Date must be at or before ${this.constraints.max.value.toISOString()}`;
                // Per-schema message overrides global template
                if (this.constraints.max.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.max.message,
                        code: ErrorCodes.DATE_MAX,
                        meta: { max: this.constraints.max.value.toISOString(), actual: input.toISOString() },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.DATE_MAX,
                        defaultMessage,
                        { max: this.constraints.max.value.toISOString(), actual: input.toISOString() }
                    );
                }
                return INVALID;
            }
        }

        return input;
    }

    /**
     * Set minimum date constraint
     */
    min(date: Date, message?: string): DateSchema {
        const schema = new DateSchema();
        schema.constraints = { ...this.constraints, min: { value: date, message } };
        return schema;
    }

    /**
     * Set maximum date constraint
     */
    max(date: Date, message?: string): DateSchema {
        const schema = new DateSchema();
        schema.constraints = { ...this.constraints, max: { value: date, message } };
        return schema;
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const schema: Record<string, any> = {
            type: 'string',
            format: 'date-time',
        };

        // Add constraints
        if (this.constraints.min) {
            schema.formatMinimum = this.constraints.min.value.toISOString();
        }
        if (this.constraints.max) {
            schema.formatMaximum = this.constraints.max.value.toISOString();
        }

        return schema;
    }
}

/**
 * Factory function to create a DateSchema
 */
export function date(): DateSchema {
    return new DateSchema();
}
