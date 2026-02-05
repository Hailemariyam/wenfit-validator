// Property tests for optional, nullable, and default modifiers
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { boolean } from '../../src/core/primitives/boolean.js';
import { object } from '../../src/core/object.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('Modifier Property Tests', () => {
    // Property 29: Optional schemas accept undefined
    // Feature: wenfit-validator, Property 29: Optional schemas accept undefined
    // Validates: Requirements 21.1
    test('Property 29: optional schemas accept undefined', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(string()),
                    fc.constant(number()),
                    fc.constant(boolean())
                ),
                (baseSchema) => {
                    const schema = baseSchema.optional();
                    const result = schema.safeParse(undefined);

                    // Should succeed
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(undefined);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 30: Nullable schemas accept null
    // Feature: wenfit-validator, Property 30: Nullable schemas accept null
    // Validates: Requirements 21.2
    test('Property 30: nullable schemas accept null', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(string()),
                    fc.constant(number()),
                    fc.constant(boolean())
                ),
                (baseSchema) => {
                    const schema = baseSchema.nullable();
                    const result = schema.safeParse(null);

                    // Should succeed
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(null);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 31: Optional nullable schemas accept both
    // Feature: wenfit-validator, Property 31: Optional nullable schemas accept both
    // Validates: Requirements 21.3
    test('Property 31: optional nullable schemas accept both undefined and null', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(string()),
                    fc.constant(number()),
                    fc.constant(boolean())
                ),
                fc.oneof(fc.constant(undefined), fc.constant(null)),
                (baseSchema, input) => {
                    const schema = baseSchema.optional().nullable();
                    const result = schema.safeParse(input);

                    // Should succeed for both undefined and null
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 31: nullable optional schemas accept both undefined and null (reversed order)', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(string()),
                    fc.constant(number()),
                    fc.constant(boolean())
                ),
                fc.oneof(fc.constant(undefined), fc.constant(null)),
                (baseSchema, input) => {
                    const schema = baseSchema.nullable().optional();
                    const result = schema.safeParse(input);

                    // Should succeed for both undefined and null
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 32: Missing required fields have correct error code
    // Feature: wenfit-validator, Property 32: Missing required fields have correct error code
    // Validates: Requirements 21.4
    test('Property 32: missing required object fields produce REQUIRED error code', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                (fieldName) => {
                    // Create an object schema with a required field
                    const schema = object({
                        [fieldName]: string(),
                    });

                    // Parse an empty object (missing the required field)
                    const result = schema.safeParse({});

                    // Should fail
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have a REQUIRED error
                        const hasRequiredError = result.errors.some(
                            e => e.code === ErrorCodes.REQUIRED
                        );
                        expect(hasRequiredError).toBe(true);

                        // Error path should include the field name
                        const requiredError = result.errors.find(
                            e => e.code === ErrorCodes.REQUIRED
                        );
                        expect(requiredError?.path).toContain(fieldName);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 33: Default values apply for undefined
    // Feature: wenfit-validator, Property 33: Default values apply for undefined
    // Validates: Requirements 22.1
    test('Property 33: default values apply when input is undefined', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.tuple(fc.constant('string'), fc.string()).map(([_, val]) => ({ schema: string(), default: val })),
                    fc.tuple(fc.constant('number'), fc.integer()).map(([_, val]) => ({ schema: number(), default: val })),
                    fc.tuple(fc.constant('boolean'), fc.boolean()).map(([_, val]) => ({ schema: boolean(), default: val }))
                ),
                ({ schema, default: defaultValue }) => {
                    const schemaWithDefault = schema.default(defaultValue);
                    const result = schemaWithDefault.safeParse(undefined);

                    // Should succeed
                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Should return the default value
                        expect(result.data).toBe(defaultValue);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 34: Default values don't apply for null
    // Feature: wenfit-validator, Property 34: Default values don't apply for null
    // Validates: Requirements 22.2
    test('Property 34: default values do not apply when input is null', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.tuple(fc.constant('string'), fc.string()).map(([_, val]) => ({ schema: string(), default: val })),
                    fc.tuple(fc.constant('number'), fc.integer()).map(([_, val]) => ({ schema: number(), default: val })),
                    fc.tuple(fc.constant('boolean'), fc.boolean()).map(([_, val]) => ({ schema: boolean(), default: val }))
                ),
                ({ schema, default: defaultValue }) => {
                    const schemaWithDefault = schema.default(defaultValue);
                    const result = schemaWithDefault.safeParse(null);

                    // Should fail (null is not a valid value for the base schema)
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have a type error (not the default value)
                        expect(result.errors.length).toBeGreaterThan(0);
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 35: Defaults apply before validation
    // Feature: wenfit-validator, Property 35: Defaults apply before validation
    // Validates: Requirements 22.3
    test('Property 35: default values are validated by the schema', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 101, max: 200 }),
                (minValue, defaultValue) => {
                    // Create a schema with a min constraint and a default that satisfies it
                    const schema = number().min(minValue).default(defaultValue);
                    const result = schema.safeParse(undefined);

                    // Should succeed because default (101-200) is >= min (1-100)
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(defaultValue);
                        expect(result.data).toBeGreaterThanOrEqual(minValue);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 35: default values that violate constraints fail validation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 50, max: 100 }),
                fc.integer({ min: 1, max: 49 }),
                (minValue, defaultValue) => {
                    // Create a schema with a min constraint and a default that violates it
                    const schema = number().min(minValue).default(defaultValue);
                    const result = schema.safeParse(undefined);

                    // Should fail because default (1-49) is < min (50-100)
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have a NUMBER_MIN error
                        const hasMinError = result.errors.some(e => e.code === ErrorCodes.NUMBER_MIN);
                        expect(hasMinError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional tests: optional schemas still validate non-undefined values
    test('optional schemas validate non-undefined values normally', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (input) => {
                    const schema = string().min(10).optional();
                    const result = schema.safeParse(input);

                    if (input.length >= 10) {
                        expect(result.success).toBe(true);
                        if (result.success) {
                            expect(result.data).toBe(input);
                        }
                    } else {
                        expect(result.success).toBe(false);
                        if (!result.success) {
                            expect(result.errors[0].code).toBe(ErrorCodes.STRING_MIN);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional tests: nullable schemas still validate non-null values
    test('nullable schemas validate non-null values normally', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                (input) => {
                    const schema = number().min(0).nullable();
                    const result = schema.safeParse(input);

                    if (input >= 0) {
                        expect(result.success).toBe(true);
                        if (result.success) {
                            expect(result.data).toBe(input);
                        }
                    } else {
                        expect(result.success).toBe(false);
                        if (!result.success) {
                            expect(result.errors[0].code).toBe(ErrorCodes.NUMBER_MIN);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional tests: default schemas validate provided values normally
    test('default schemas validate provided values normally', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (input) => {
                    const schema = string().email().default('default@example.com');
                    const result = schema.safeParse(input);

                    // If input looks like an email, should pass
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(input)) {
                        expect(result.success).toBe(true);
                        if (result.success) {
                            expect(result.data).toBe(input);
                        }
                    } else {
                        expect(result.success).toBe(false);
                        if (!result.success) {
                            expect(result.errors[0].code).toBe(ErrorCodes.STRING_EMAIL);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
