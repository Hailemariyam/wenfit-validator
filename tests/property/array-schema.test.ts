// Property tests for ArraySchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { array } from '../../src/core/array.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { boolean } from '../../src/core/primitives/boolean.js';
import { object } from '../../src/core/object.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('ArraySchema Property Tests', () => {
    // Property 10: Array schemas validate all elements
    // Feature: wenfit-validator, Property 10: Array schemas validate all elements
    // Validates: Requirements 7.1
    test('Property 10: array schemas validate all elements according to element schema', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string()),
                (input) => {
                    const schema = array(string());
                    const result = schema.safeParse(input);

                    // Should succeed for valid input
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toEqual(input);
                        expect(result.data.length).toBe(input.length);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 10: array schemas reject arrays with invalid elements', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string()),
                fc.integer({ min: 0, max: 10 }),
                fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
                (validElements, insertIndex, invalidElement) => {
                    // Insert an invalid element into the array
                    const input = [...validElements];
                    const actualIndex = Math.min(insertIndex, input.length);
                    input.splice(actualIndex, 0, invalidElement);

                    const schema = array(string());
                    const result = schema.safeParse(input);

                    // Should fail because one element is not a string
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Should have a type error for the invalid element
                        const typeError = result.errors.find(e => e.code === ErrorCodes.INVALID_TYPE);
                        expect(typeError).toBeDefined();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 10: array schemas validate nested object elements', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        name: fc.string(),
                        age: fc.integer(),
                    })
                ),
                (input) => {
                    const schema = array(
                        object({
                            name: string(),
                            age: number(),
                        })
                    );
                    const result = schema.safeParse(input);

                    // Should succeed for valid input
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data.length).toBe(input.length);
                        result.data.forEach((item, i) => {
                            expect(item.name).toBe(input[i].name);
                            expect(item.age).toBe(input[i].age);
                        });
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 8: Error paths track nested locations (arrays)
    // Feature: wenfit-validator, Property 8: Error paths track nested locations (arrays)
    // Validates: Requirements 7.3
    test('Property 8: error paths track array element indices', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
                fc.integer({ min: 0, max: 9 }),
                fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
                (validElements, insertIndex, invalidElement) => {
                    // Insert an invalid element at a specific index
                    const input = [...validElements];
                    const actualIndex = Math.min(insertIndex, input.length);
                    input.splice(actualIndex, 0, invalidElement);

                    const schema = array(string());
                    const result = schema.safeParse(input);

                    // Should fail because one element is not a string
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Error path should include the array index
                        const typeError = result.errors.find(e => e.code === ErrorCodes.INVALID_TYPE);
                        expect(typeError).toBeDefined();
                        if (typeError) {
                            expect(typeError.path).toEqual([actualIndex]);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 8: error paths track nested array and object locations', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        name: fc.string(),
                        age: fc.integer(),
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.integer({ min: 0, max: 4 }),
                fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
                (validElements, elementIndex, invalidValue) => {
                    // Create input with an invalid 'name' property at a specific index
                    const input = validElements.map((el, i) => {
                        if (i === Math.min(elementIndex, validElements.length - 1)) {
                            return { ...el, name: invalidValue };
                        }
                        return el;
                    });

                    const schema = array(
                        object({
                            name: string(),
                            age: number(),
                        })
                    );
                    const result = schema.safeParse(input);

                    // Should fail because one element has invalid name
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Error path should track array index and property name
                        const typeError = result.errors.find(e => e.code === ErrorCodes.INVALID_TYPE);
                        expect(typeError).toBeDefined();
                        if (typeError) {
                            const actualIndex = Math.min(elementIndex, validElements.length - 1);
                            expect(typeError.path).toEqual([actualIndex, 'name']);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional tests for array constraints
    test('array schemas reject non-array types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.boolean(),
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.object()
                ),
                (input) => {
                    const schema = array(string());
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have type error
                        expect(result.errors.length).toBeGreaterThan(0);
                        expect(result.errors[0].code).toBe(ErrorCodes.INVALID_TYPE);
                        expect(result.errors[0].message).toContain('array');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('array min constraint produces ARRAY_MIN error code', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { maxLength: 5 }),
                fc.integer({ min: 6, max: 20 }),
                (input, minLength) => {
                    // Input is shorter than min
                    if (input.length < minLength) {
                        const schema = array(string()).min(minLength);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMinError = result.errors.some(e => e.code === ErrorCodes.ARRAY_MIN);
                            expect(hasMinError).toBe(true);

                            // Check metadata
                            const minError = result.errors.find(e => e.code === ErrorCodes.ARRAY_MIN);
                            expect(minError?.meta?.min).toBe(minLength);
                            expect(minError?.meta?.actual).toBe(input.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('array max constraint produces ARRAY_MAX error code', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 10, maxLength: 20 }),
                fc.integer({ min: 1, max: 9 }),
                (input, maxLength) => {
                    // Input is longer than max
                    if (input.length > maxLength) {
                        const schema = array(string()).max(maxLength);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMaxError = result.errors.some(e => e.code === ErrorCodes.ARRAY_MAX);
                            expect(hasMaxError).toBe(true);

                            // Check metadata
                            const maxError = result.errors.find(e => e.code === ErrorCodes.ARRAY_MAX);
                            expect(maxError?.meta?.max).toBe(maxLength);
                            expect(maxError?.meta?.actual).toBe(input.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('array length constraint produces ARRAY_LENGTH error code', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
                fc.integer({ min: 1, max: 30 }),
                (input, exactLength) => {
                    // Input has different length than required
                    if (input.length !== exactLength) {
                        const schema = array(string()).length(exactLength);
                        const result = schema.safeParse(input);

                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasLengthError = result.errors.some(e => e.code === ErrorCodes.ARRAY_LENGTH);
                            expect(hasLengthError).toBe(true);

                            // Check metadata
                            const lengthError = result.errors.find(e => e.code === ErrorCodes.ARRAY_LENGTH);
                            expect(lengthError?.meta?.length).toBe(exactLength);
                            expect(lengthError?.meta?.actual).toBe(input.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('array nonempty constraint rejects empty arrays', () => {
        const schema = array(string()).nonempty();
        const result = schema.safeParse([]);

        expect(result.success).toBe(false);
        if (!result.success) {
            const hasMinError = result.errors.some(e => e.code === ErrorCodes.ARRAY_MIN);
            expect(hasMinError).toBe(true);
        }
    });

    test('arrays within constraints pass validation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 5 }),
                fc.integer({ min: 8, max: 15 }),
                (min, max) => {
                    fc.assert(
                        fc.property(
                            fc.array(fc.string(), { minLength: min, maxLength: max }),
                            (input) => {
                                const schema = array(string()).min(min).max(max);
                                const result = schema.safeParse(input);

                                expect(result.success).toBe(true);
                                if (result.success) {
                                    expect(result.data).toEqual(input);
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
