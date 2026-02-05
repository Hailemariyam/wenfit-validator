// Property tests for DateSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { date } from '../../src/core/primitives/date.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('DateSchema Property Tests', () => {
    // Property 3: Type validation rejects wrong types (date)
    // Feature: wenfit-validator, Property 3: Type validation rejects wrong types (date)
    // Validates: Requirements 4.2
    test('Property 3: date schema rejects non-date types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.float(),
                    fc.boolean(),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.object(),
                    fc.array(fc.anything()),
                    fc.func(fc.anything())
                ),
                (input) => {
                    const schema = date();
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // First error should be type error
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                        expect(result.errors[0].message).toContain('date');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 3: date schema rejects invalid Date objects', () => {
        const schema = date();
        const invalidDate = new Date('invalid');
        const result = schema.safeParse(invalidDate);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
        }
    });

    // Additional test: valid dates pass validation
    test('valid dates pass basic date validation', () => {
        fc.assert(
            fc.property(fc.date(), (input) => {
                const schema = date();
                const result = schema.safeParse(input);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(input);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: dates within min/max constraints pass validation
    test('dates within min/max constraints pass validation', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                (input) => {
                    const minDate = new Date('2020-01-01');
                    const maxDate = new Date('2025-12-31');
                    const schema = date().min(minDate).max(maxDate);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                        expect(input.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
                        expect(input.getTime()).toBeLessThanOrEqual(maxDate.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: dates before min constraint fail validation
    test('dates before min constraint fail validation', () => {
        fc.assert(
            fc.property(
                fc.date({ max: new Date('2020-01-01') }),
                (input) => {
                    const minDate = new Date('2020-01-02');
                    const schema = date().min(minDate);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasMinError = result.errors.some(e => e.code === ErrorCodes.DATE_MIN);
                        expect(hasMinError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: dates after max constraint fail validation
    test('dates after max constraint fail validation', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2025-01-02') }),
                (input) => {
                    const maxDate = new Date('2025-01-01');
                    const schema = date().max(maxDate);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        const hasMaxError = result.errors.some(e => e.code === ErrorCodes.DATE_MAX);
                        expect(hasMaxError).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
