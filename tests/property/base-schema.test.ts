// Property tests for base schema behavior
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { Schema } from '../../src/core/schema.js';
import { ParseContext } from '../../src/core/parse-context.js';
import { ValidationError } from '../../src/errors/validation-error.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';
import type { ParseResult } from '../../src/types/validation-result.js';
import { INVALID } from '../../src/types/validation-result.js';

// Test schema that always fails validation
class AlwaysFailSchema extends Schema<any, any> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<any> {
        ctx.addError({
            path: ctx.getCurrentPath(),
            message: 'Always fails',
            code: ErrorCodes.CUSTOM,
        });
        return INVALID;
    }
}

// Test schema that always succeeds validation
class AlwaysSucceedSchema extends Schema<any, any> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<any> {
        return input;
    }
}

// Test schema that validates only strings
class SimpleStringSchema extends Schema<string, string> {
    _parse(input: unknown, ctx: ParseContext): ParseResult<string> {
        if (typeof input !== 'string') {
            ctx.addError({
                path: ctx.getCurrentPath(),
                message: 'Expected string',
                code: ErrorCodes.INVALID_TYPE,
            });
            return INVALID;
        }
        return input;
    }
}

describe('Base Schema Property Tests', () => {
    // Property 1: Parse throws on invalid input
    // Feature: wenfit-validator, Property 1: Parse throws on invalid input
    // Validates: Requirements 1.2, 24.1
    test('Property 1: parse throws ValidationError for any invalid input', () => {
        fc.assert(
            fc.property(fc.anything(), (input) => {
                const schema = new AlwaysFailSchema();

                // parse should throw ValidationError
                expect(() => schema.parse(input)).toThrow(ValidationError);

                // The thrown error should contain validation errors
                try {
                    schema.parse(input);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationError);
                    expect((error as ValidationError).errors).toHaveLength(1);
                    expect((error as ValidationError).errors[0]).toHaveProperty('path');
                    expect((error as ValidationError).errors[0]).toHaveProperty('message');
                    expect((error as ValidationError).errors[0]).toHaveProperty('code');
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 2: SafeParse never throws
    // Feature: wenfit-validator, Property 2: SafeParse never throws
    // Validates: Requirements 1.3, 24.1
    test('Property 2: safeParse never throws for any input', () => {
        fc.assert(
            fc.property(
                fc.anything(),
                fc.constantFrom(
                    new AlwaysFailSchema(),
                    new AlwaysSucceedSchema(),
                    new SimpleStringSchema()
                ),
                (input, schema) => {
                    // safeParse should never throw
                    expect(() => schema.safeParse(input)).not.toThrow();

                    // Should always return ValidationResult
                    const result = schema.safeParse(input);
                    expect(result).toHaveProperty('success');

                    if (result.success) {
                        expect(result).toHaveProperty('data');
                        expect(result).not.toHaveProperty('errors');
                    } else {
                        expect(result).toHaveProperty('errors');
                        expect(result).not.toHaveProperty('data');
                        expect(Array.isArray(result.errors)).toBe(true);
                        expect(result.errors.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: parse succeeds for valid input
    test('parse returns data for valid input', () => {
        fc.assert(
            fc.property(fc.anything(), (input) => {
                const schema = new AlwaysSucceedSchema();
                const result = schema.parse(input);
                expect(result).toBe(input);
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: safeParse structure for valid input
    test('safeParse returns success result for valid input', () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const schema = new SimpleStringSchema();
                const result = schema.safeParse(input);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(input);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: safeParse structure for invalid input
    test('safeParse returns failure result for invalid input', () => {
        fc.assert(
            fc.property(
                fc.anything().filter(x => typeof x !== 'string'),
                (input) => {
                    const schema = new SimpleStringSchema();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors).toHaveLength(1);
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
