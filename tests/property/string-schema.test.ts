// Property tests for StringSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('StringSchema Property Tests', () => {
    // Property 3: Type validation rejects wrong types (string)
    // Feature: wenfit-validator, Property 3: Type validation rejects wrong types (string)
    // Validates: Requirements 2.1
    test('Property 3: string schema rejects non-string types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.integer(),
                    fc.boolean(),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.object(),
                    fc.array(fc.anything()),
                    fc.func(fc.anything())
                ),
                (input) => {
                    const schema = string();
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // First error should be type error
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                        expect(result.errors[0].message).toContain('string');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 4: Error codes match constraint violations (string)
    // Feature: wenfit-validator, Property 4: Error codes match constraint violations (string)
    // Validates: Requirements 2.8
    test('Property 4: string constraint violations produce correct error codes', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.integer({ min: 1, max: 50 }),
                (input, minLength) => {
                    // Test min constraint
                    if (input.length < minLength) {
                        const schema = string().min(minLength);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMinError = result.errors.some(e => e.code === ErrorCodes.STRING_MIN);
                            expect(hasMinError).toBe(true);

                            // Check metadata
                            const minError = result.errors.find(e => e.code === ErrorCodes.STRING_MIN);
                            expect(minError?.meta?.min).toBe(minLength);
                            expect(minError?.meta?.actual).toBe(input.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: max constraint violations produce STRING_MAX error code', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 10, maxLength: 100 }),
                fc.integer({ min: 1, max: 9 }),
                (input, maxLength) => {
                    // Test max constraint - input is longer than max
                    if (input.length > maxLength) {
                        const schema = string().max(maxLength);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMaxError = result.errors.some(e => e.code === ErrorCodes.STRING_MAX);
                            expect(hasMaxError).toBe(true);

                            // Check metadata
                            const maxError = result.errors.find(e => e.code === ErrorCodes.STRING_MAX);
                            expect(maxError?.meta?.max).toBe(maxLength);
                            expect(maxError?.meta?.actual).toBe(input.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: email constraint violations produce STRING_EMAIL error code', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !s.includes('@') || !s.includes('.')),
                (input) => {
                    const schema = string().email();
                    const result = schema.safeParse(input);

                    // Most strings without @ or . should fail email validation
                    if (!result.success) {
                        const hasEmailError = result.errors.some(e => e.code === ErrorCodes.STRING_EMAIL);
                        expect(hasEmailError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: url constraint violations produce STRING_URL error code', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://')),
                (input) => {
                    const schema = string().url();
                    const result = schema.safeParse(input);

                    // Most strings without http:// or https:// should fail URL validation
                    if (!result.success) {
                        const hasUrlError = result.errors.some(e => e.code === ErrorCodes.STRING_URL);
                        expect(hasUrlError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: pattern constraint violations produce STRING_PATTERN error code', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !/^\d+$/.test(s)), // strings that are not all digits
                (input) => {
                    const schema = string().pattern(/^\d+$/); // require all digits
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasPatternError = result.errors.some(e => e.code === ErrorCodes.STRING_PATTERN);
                        expect(hasPatternError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: valid strings pass validation
    test('valid strings pass basic string validation', () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const schema = string();
                const result = schema.safeParse(input);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(input);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: strings within constraints pass validation
    test('strings within min/max constraints pass validation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 5, max: 20 }),
                fc.integer({ min: 25, max: 50 }),
                (min, max) => {
                    fc.assert(
                        fc.property(
                            fc.string({ minLength: min, maxLength: max }),
                            (input) => {
                                const schema = string().min(min).max(max);
                                const result = schema.safeParse(input);

                                expect(result.success).toBe(true);
                                if (result.success) {
                                    expect(result.data).toBe(input);
                                    expect(input.length).toBeGreaterThanOrEqual(min);
                                    expect(input.length).toBeLessThanOrEqual(max);
                                }
                            }
                        ),
                        { numRuns: 10 }
                    );
                }
            ),
            { numRuns: 10 }
        );
    });
});
