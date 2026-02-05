// Property tests for custom validation with refine
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { object } from '../../src/core/object.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('Refine Property Tests', () => {
    // Property 20: Custom refine errors include messages
    // Feature: wenfit-validator, Property 20: Custom refine errors include messages
    // Validates: Requirements 11.2
    test('Property 20: custom refine errors include the provided message', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer(),
                (customMessage, input) => {
                    // Create a schema with a refine rule that always fails
                    const schema = number().refine(
                        () => false,
                        customMessage
                    );

                    const result = schema.safeParse(input);

                    // Should fail
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have an error with the custom message
                        const hasCustomMessage = result.errors.some(
                            e => e.message === customMessage
                        );
                        expect(hasCustomMessage).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 20: custom refine errors include custom code when provided', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer(),
                (customMessage, customCode, input) => {
                    // Create a schema with a refine rule that always fails with custom code
                    const schema = number().refine(
                        () => false,
                        { message: customMessage, code: customCode }
                    );

                    const result = schema.safeParse(input);

                    // Should fail
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have an error with the custom message and code
                        const customError = result.errors.find(
                            e => e.message === customMessage && e.code === customCode
                        );
                        expect(customError).toBeDefined();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 20: custom refine errors use "custom" code by default', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer(),
                (customMessage, input) => {
                    // Create a schema with a refine rule that always fails
                    const schema = number().refine(
                        () => false,
                        customMessage
                    );

                    const result = schema.safeParse(input);

                    // Should fail
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have an error with code "custom"
                        const customError = result.errors.find(
                            e => e.message === customMessage
                        );
                        expect(customError?.code).toBe('custom');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 21: Custom rules run after built-in rules
    // Feature: wenfit-validator, Property 21: Custom rules run after built-in rules
    // Validates: Requirements 11.5
    test('Property 21: refine rules do not execute when built-in validation fails', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.integer({ min: 1, max: 100 }),
                (input, minLength) => {
                    let refineCalled = false;

                    // Create a schema with built-in validation and a refine rule
                    const schema = string()
                        .min(minLength)
                        .refine(() => {
                            refineCalled = true;
                            return true;
                        }, 'Custom validation');

                    const result = schema.safeParse(input);

                    // If built-in validation fails (string too short)
                    if (input.length < minLength) {
                        // Refine should NOT have been called
                        expect(refineCalled).toBe(false);

                        // Should have a STRING_MIN error
                        expect(result.success).toBe(false);
                        if (!result.success) {
                            const hasMinError = result.errors.some(
                                e => e.code === ErrorCodes.STRING_MIN
                            );
                            expect(hasMinError).toBe(true);

                            // Should NOT have a custom error
                            const hasCustomError = result.errors.some(
                                e => e.message === 'Custom validation'
                            );
                            expect(hasCustomError).toBe(false);
                        }
                    } else {
                        // Built-in validation passed, refine should have been called
                        expect(refineCalled).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 21: refine rules execute after all built-in validations pass', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 100 }),
                fc.integer({ min: 1, max: 9 }),
                (input, minValue) => {
                    // Create a schema with built-in validation that will pass
                    // and a refine rule that will fail
                    const schema = number()
                        .min(minValue)
                        .refine(
                            (val) => val < 10,
                            'Must be less than 10'
                        );

                    const result = schema.safeParse(input);

                    // Built-in validation passes (input >= minValue)
                    // But refine fails (input >= 10)
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have the custom error (not a built-in error)
                        const hasCustomError = result.errors.some(
                            e => e.message === 'Must be less than 10'
                        );
                        expect(hasCustomError).toBe(true);

                        // Should NOT have a NUMBER_MIN error
                        const hasMinError = result.errors.some(
                            e => e.code === ErrorCodes.NUMBER_MIN
                        );
                        expect(hasMinError).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: refine with passing predicate
    test('refine allows valid values that pass the predicate', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                (input) => {
                    // Create a schema with a refine rule that checks for even numbers
                    const schema = number().refine(
                        (val) => val % 2 === 0,
                        'Must be even'
                    );

                    const result = schema.safeParse(input);

                    if (input % 2 === 0) {
                        // Should pass
                        expect(result.success).toBe(true);
                        if (result.success) {
                            expect(result.data).toBe(input);
                        }
                    } else {
                        // Should fail with custom error
                        expect(result.success).toBe(false);
                        if (!result.success) {
                            expect(result.errors[0].message).toBe('Must be even');
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: multiple refine rules
    test('multiple refine rules are all executed in order', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                (input) => {
                    const executionOrder: number[] = [];

                    // Create a schema with multiple refine rules
                    const schema = number()
                        .refine(() => {
                            executionOrder.push(1);
                            return true;
                        }, 'First rule')
                        .refine(() => {
                            executionOrder.push(2);
                            return true;
                        }, 'Second rule')
                        .refine(() => {
                            executionOrder.push(3);
                            return true;
                        }, 'Third rule');

                    schema.safeParse(input);

                    // All rules should execute in order
                    expect(executionOrder).toEqual([1, 2, 3]);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: refine on object schemas
    test('refine works on object schemas', () => {
        fc.assert(
            fc.property(
                fc.record({
                    start: fc.integer({ min: 0, max: 50 }),
                    end: fc.integer({ min: 51, max: 100 }),
                }),
                (input) => {
                    // Create an object schema with a refine rule
                    const schema = object({
                        start: number(),
                        end: number(),
                    }).refine(
                        (obj) => obj.start < obj.end,
                        'Start must be before end'
                    );

                    const result = schema.safeParse(input);

                    // Should pass because start < end
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toEqual(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('refine on object schemas fails when predicate returns false', () => {
        fc.assert(
            fc.property(
                fc.record({
                    start: fc.integer({ min: 51, max: 100 }),
                    end: fc.integer({ min: 0, max: 50 }),
                }),
                (input) => {
                    // Create an object schema with a refine rule
                    const schema = object({
                        start: number(),
                        end: number(),
                    }).refine(
                        (obj) => obj.start < obj.end,
                        'Start must be before end'
                    );

                    const result = schema.safeParse(input);

                    // Should fail because start >= end
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors[0].message).toBe('Start must be before end');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
