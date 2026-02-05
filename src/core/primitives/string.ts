// StringSchema - validation for string types

import { Schema } from '../schema.js';
import { ParseContext } from '../parse-context.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { ParseResult } from '../../types/validation-result.js';
import { INVALID } from '../../types/validation-result.js';

interface StringConstraint {
    value: number | RegExp;
    message?: string;
}

interface StringConstraints {
    min?: StringConstraint;
    max?: StringConstraint;
    length?: StringConstraint;
    pattern?: StringConstraint;
    email?: { message?: string };
    url?: { message?: string };
}

/**
 * Schema for validating string values
 */
export class StringSchema extends Schema<string, string> {
    private constraints: StringConstraints = {};

    _parse(input: unknown, ctx: ParseContext): ParseResult<string> {
        // Type check
        if (typeof input !== 'string') {
            ctx.addErrorWithTemplate(
                ErrorCodes.INVALID_TYPE,
                'Expected string',
                { expected: 'string', received: typeof input }
            );
            return INVALID;
        }

        // Min length constraint
        if (this.constraints.min) {
            const minValue = this.constraints.min.value as number;
            if (input.length < minValue) {
                const defaultMessage = `String must be at least ${minValue} characters`;
                // Per-schema message overrides global template
                if (this.constraints.min.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.min.message,
                        code: ErrorCodes.STRING_MIN,
                        meta: { min: minValue, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_MIN,
                        defaultMessage,
                        { min: minValue, actual: input.length }
                    );
                }
                return INVALID;
            }
        }

        // Max length constraint
        if (this.constraints.max) {
            const maxValue = this.constraints.max.value as number;
            if (input.length > maxValue) {
                const defaultMessage = `String must be at most ${maxValue} characters`;
                // Per-schema message overrides global template
                if (this.constraints.max.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.max.message,
                        code: ErrorCodes.STRING_MAX,
                        meta: { max: maxValue, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_MAX,
                        defaultMessage,
                        { max: maxValue, actual: input.length }
                    );
                }
                return INVALID;
            }
        }

        // Exact length constraint
        if (this.constraints.length) {
            const lengthValue = this.constraints.length.value as number;
            if (input.length !== lengthValue) {
                const defaultMessage = `String must be exactly ${lengthValue} characters`;
                // Per-schema message overrides global template
                if (this.constraints.length.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.length.message,
                        code: ErrorCodes.STRING_LENGTH,
                        meta: { length: lengthValue, actual: input.length },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_LENGTH,
                        defaultMessage,
                        { length: lengthValue, actual: input.length }
                    );
                }
                return INVALID;
            }
        }

        // Pattern/regex constraint
        if (this.constraints.pattern) {
            const regex = this.constraints.pattern.value as RegExp;
            if (!regex.test(input)) {
                const defaultMessage = 'String does not match pattern';
                // Per-schema message overrides global template
                if (this.constraints.pattern.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.pattern.message,
                        code: ErrorCodes.STRING_PATTERN,
                        meta: { pattern: regex.source },
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_PATTERN,
                        defaultMessage,
                        { pattern: regex.source }
                    );
                }
                return INVALID;
            }
        }

        // Email validation
        if (this.constraints.email) {
            // Simple email regex - not perfect but good enough for most cases
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input)) {
                const defaultMessage = 'Invalid email format';
                // Per-schema message overrides global template
                if (this.constraints.email.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.email.message,
                        code: ErrorCodes.STRING_EMAIL,
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_EMAIL,
                        defaultMessage
                    );
                }
                return INVALID;
            }
        }

        // URL validation
        if (this.constraints.url) {
            try {
                new URL(input);
            } catch {
                const defaultMessage = 'Invalid URL format';
                // Per-schema message overrides global template
                if (this.constraints.url.message) {
                    ctx.addError({
                        path: ctx.getCurrentPath(),
                        message: this.constraints.url.message,
                        code: ErrorCodes.STRING_URL,
                    });
                } else {
                    ctx.addErrorWithTemplate(
                        ErrorCodes.STRING_URL,
                        defaultMessage
                    );
                }
                return INVALID;
            }
        }

        return input;
    }

    /**
     * Set minimum length constraint
     */
    min(length: number, message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, min: { value: length, message } };
        return schema;
    }

    /**
     * Set maximum length constraint
     */
    max(length: number, message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, max: { value: length, message } };
        return schema;
    }

    /**
     * Set exact length constraint
     */
    length(exact: number, message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, length: { value: exact, message } };
        return schema;
    }

    /**
     * Set regex pattern constraint
     */
    pattern(regex: RegExp, message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, pattern: { value: regex, message } };
        return schema;
    }

    /**
     * Validate email format
     */
    email(message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, email: { message } };
        return schema;
    }

    /**
     * Validate URL format
     */
    url(message?: string): StringSchema {
        const schema = new StringSchema();
        schema.constraints = { ...this.constraints, url: { message } };
        return schema;
    }

    /**
     * Transform: trim whitespace from both ends
     */
    trim(): Schema<string, string> {
        return this.transform((value) => value.trim());
    }

    /**
     * Transform: convert to lowercase
     */
    toLowerCase(): Schema<string, string> {
        return this.transform((value) => value.toLowerCase());
    }

    /**
     * Transform: convert to uppercase
     */
    toUpperCase(): Schema<string, string> {
        return this.transform((value) => value.toUpperCase());
    }

    /**
     * Convert to JSON Schema format
     */
    toJSONSchema(): Record<string, any> {
        const schema: Record<string, any> = {
            type: 'string',
        };

        // Add constraints
        if (this.constraints.min) {
            schema.minLength = this.constraints.min.value;
        }
        if (this.constraints.max) {
            schema.maxLength = this.constraints.max.value;
        }
        if (this.constraints.length) {
            schema.minLength = this.constraints.length.value;
            schema.maxLength = this.constraints.length.value;
        }
        if (this.constraints.pattern) {
            schema.pattern = (this.constraints.pattern.value as RegExp).source;
        }
        if (this.constraints.email) {
            schema.format = 'email';
        }
        if (this.constraints.url) {
            schema.format = 'uri';
        }

        return schema;
    }
}

/**
 * Factory function to create a StringSchema
 */
export function string(): StringSchema {
    return new StringSchema();
}
