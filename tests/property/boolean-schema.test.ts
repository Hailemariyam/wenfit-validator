// Property tests for BooleanSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { boolean } from '../../src/core/primitives/boolean.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('BooleanSchema Property Tests', () => {
    // Property 3: Type validation rejects wrong types (boolean)
    // Feature: wenfit-validator, Property 3: Type validation rejects wrong types (boolean)
    // Validates: Requirements 4.1
    test('Property 3: boolean schema rejects non-boolean types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.float(),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.object(),
                    fc.array(fc.anything()),
                    fc.func(fc.anything())
                ),
                (input) => {
                    const schema = boolean();
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // First error should be type error
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                        expect(result.errors[0].message).toContain('boolean');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: valid booleans pass validation
    test('valid booleans pass basic boolean validation', () => {
        fc.assert(
            fc.property(fc.boolean(), (input) => {
                const schema = boolean();
                const result = schema.safeParse(input);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(input);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Additional test: both true and false pass validation
    test('both true and false pass validation', () => {
        const schema = boolean();

        const trueResult = schema.safeParse(true);
        expect(trueResult.success).toBe(true);
        if (trueResult.success) {
            expect(trueResult.data).toBe(true);
        }

        const falseResult = schema.safeParse(false);
        expect(falseResult.success).toBe(true);
        if (falseResult.success) {
            expect(falseResult.data).toBe(false);
        }
    });
});
