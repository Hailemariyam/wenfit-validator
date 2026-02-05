// Property tests for UnionSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { union } from '../../src/core/union.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { boolean } from '../../src/core/primitives/boolean.js';
import { object } from '../../src/core/object.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('UnionSchema Property Tests', () => {
    // Property 11: Union accepts any matching member
    // Feature: wenfit-validator, Property 11: Union accepts any matching member
    // Validates: Requirements 8.1
    test('Property 11: union accepts input matching any member schema', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.boolean()
                ),
                (input) => {
                    const schema = union([string(), number(), boolean()]);
                    const result = schema.safeParse(input);

                    // Should succeed for any of the union members
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 12: Union errors include all member failures
    // Feature: wenfit-validator, Property 12: Union errors include all member failures
    // Validates: Requirements 8.2
    test('Property 12: union errors include all member validation failures', () => {
        fc.assert(
            fc.property(
                // Generate inputs that don't match any union member
                fc.oneof(
                    fc.array(fc.anything()),
                    fc.object({}),
                    fc.constant(null),
                    fc.constant(undefined)
                ),
                (input) => {
                    const schema = union([string(), number(), boolean()]);
                    const result = schema.safeParse(input);

                    // Should fail for non-matching input
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have a union error
                        expect(result.errors.length).toBeGreaterThan(0);
                        const unionError = result.errors[0];
                        expect(unionError.code).toBe(ErrorCodes.UNION_INVALID);

                        // Should include errors from all member attempts
                        expect(unionError.meta).toBeDefined();
                        expect(unionError.meta?.unionErrors).toBeDefined();
                        expect(Array.isArray(unionError.meta?.unionErrors)).toBe(true);
                        // Should have errors from all 3 members (string, number, boolean)
                        expect(unionError.meta?.unionErrors.length).toBe(3);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Union with object schemas
    test('union accepts input matching any object member', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.record({ type: fc.constant('a'), value: fc.string() }),
                    fc.record({ type: fc.constant('b'), count: fc.integer() })
                ),
                (input) => {
                    const schemaA = object({ type: string(), value: string() });
                    const schemaB = object({ type: string(), count: number() });
                    const schema = union([schemaA, schemaB]);

                    const result = schema.safeParse(input);
                    expect(result.success).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Union with two schemas
    test('union with two schemas accepts either type', () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.string(), fc.integer()),
                (input) => {
                    const schema = union([string(), number()]);
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

    // Additional test: Union rejects input not matching any member
    test('union rejects input not matching any member', () => {
        fc.assert(
            fc.property(
                fc.array(fc.anything()),
                (input) => {
                    const schema = union([string(), number()]);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors[0].code).toBe(ErrorCodes.UNION_INVALID);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
