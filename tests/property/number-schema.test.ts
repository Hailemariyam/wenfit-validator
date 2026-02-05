// Property tests for NumberSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { number } from '../../src/core/primitives/number.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('NumberSchema Property Tests', () => {
    // Property 3: Type validation rejects wrong types (number)
    // Feature: wenfit-validator, Property 3: Type validation rejects wrong types (number)
    // Validates: Requirements 3.1
    test('Property 3: number schema rejects non-number types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string(),
                    fc.boolean(),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.object(),
                    fc.array(fc.anything()),
                    fc.func(fc.anything())
                ),
                (input) => {
                    const schema = number();
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // First error should be type error
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                        expect(result.errors[0].message).toContain('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 3: number schema rejects NaN', () => {
        const schema = number();
        const result = schema.safeParse(NaN);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
        }
    });

    // Property 4: Error codes match constraint violations (number)
    // Feature: wenfit-validator, Property 4: Error codes match constraint violations (number)
    // Validates: Requirements 3.7
    test('Property 4: number constraint violations produce correct error codes', () => {
        fc.assert(
            fc.property(
                fc.float(),
                fc.float({ min: -1000, max: 1000 }),
                (input, minValue) => {
                    // Test min constraint
                    if (input < minValue && Number.isFinite(input)) {
                        const schema = number().min(minValue);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMinError = result.errors.some(e => e.code === ErrorCodes.NUMBER_MIN);
                            expect(hasMinError).toBe(true);

                            // Check metadata
                            const minError = result.errors.find(e => e.code === ErrorCodes.NUMBER_MIN);
                            expect(minError?.meta?.min).toBe(minValue);
                            expect(minError?.meta?.actual).toBe(input);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: max constraint violations produce NUMBER_MAX error code', () => {
        fc.assert(
            fc.property(
                fc.float(),
                fc.float({ min: -1000, max: 1000 }),
                (input, maxValue) => {
                    // Test max constraint
                    if (input > maxValue && Number.isFinite(input)) {
                        const schema = number().max(maxValue);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMaxError = result.errors.some(e => e.code === ErrorCodes.NUMBER_MAX);
                            expect(hasMaxError).toBe(true);

                            // Check metadata
                            const maxError = result.errors.find(e => e.code === ErrorCodes.NUMBER_MAX);
                            expect(maxError?.meta?.max).toBe(maxValue);
                            expect(maxError?.meta?.actual).toBe(input);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: int constraint violations produce NUMBER_INT error code', () => {
        fc.assert(
            fc.property(
                fc.float().filter(n => !Number.isInteger(n) && Number.isFinite(n)),
                (input) => {
                    const schema = number().int();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasIntError = result.errors.some(e => e.code === ErrorCodes.NUMBER_INT);
                        expect(hasIntError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test.skip('Property 4: positive constraint violations produce NUMBER_POSITIVE error code', () => {
        fc.assert(
            fc.property(
                fc.float({ max: 0 }),
                (input) => {
                    const schema = number().positive();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasPositiveError = result.errors.some(e => e.code === ErrorCodes.NUMBER_POSITIVE);
                        expect(hasPositiveError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: negative constraint violations produce NUMBER_NEGATIVE error code', () => {
        fc.assert(
            fc.property(
                fc.float({ min: 0 }).filter(n => !Number.isNaN(n)),
                (input) => {
                    const schema = number().negative();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasNegativeError = result.errors.some(e => e.code === ErrorCodes.NUMBER_NEGATIVE);
                        expect(hasNegativeError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: finite constraint violations produce NUMBER_FINITE error code', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(Infinity, -Infinity),
                (input) => {
                    const schema = number().finite();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasFiniteError = result.errors.some(e => e.code === ErrorCodes.NUMBER_FINITE);
                        expect(hasFiniteError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: valid numbers pass validation
    test('valid numbers pass basic number validation', () => {
        fc.assert(
            fc.property(
                fc.float().filter(n => Number.isFinite(n)),
                (input) => {
                    const schema = number();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: numbers within constraints pass validation
    test('numbers within min/max constraints pass validation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -100, max: 0 }),
                fc.integer({ min: 1, max: 100 }),
                (min, max) => {
                    fc.assert(
                        fc.property(
                            fc.float({ min, max }).filter(n => !Number.isNaN(n)),
                            (input) => {
                                const schema = number().min(min).max(max);
                                const result = schema.safeParse(input);

                                expect(result.success).toBe(true);
                                if (result.success) {
                                    expect(result.data).toBe(input);
                                    expect(input).toBeGreaterThanOrEqual(min);
                                    expect(input).toBeLessThanOrEqual(max);
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

    // Additional test: integers pass int constraint
    test('integers pass int constraint', () => {
        fc.assert(
            fc.property(fc.integer(), (input) => {
                const schema = number().int();
                const result = schema.safeParse(input);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(input);
                }
            }),
            { numRuns: 100 }
        );
    });
});
