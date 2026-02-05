// Property tests for error handling and edge cases
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { date } from '../../src/core/primitives/date.js';
import { object } from '../../src/core/object.js';
import { array } from '../../src/core/array.js';

describe('Error Handling Property Tests', () => {
    // Property 22: Validation errors have complete structure
    // Feature: wenfit-validator, Property 22: Validation errors have complete structure
    // Validates: Requirements 12.1, 12.2, 12.3, 12.4
    test('Property 22: all validation errors have complete structure (path, message, code, optional meta)', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    // Generate invalid inputs for various schema types
                    fc.record({ value: fc.integer(), schema: fc.constant(string()) }), // number for string schema
                    fc.record({ value: fc.string(), schema: fc.constant(number()) }), // string for number schema
                    fc.record({
                        value: fc.record({ name: fc.integer() }),
                        schema: fc.constant(object({ name: string() }))
                    }), // wrong type in object
                    fc.record({
                        value: fc.array(fc.integer()).filter(arr => arr.length > 0),
                        schema: fc.constant(array(string()))
                    }), // wrong element type in array (non-empty)
                ),
                ({ value, schema }) => {
                    const result = schema.safeParse(value);

                    // Should fail validation (skip if it passes - e.g., empty array)
                    if (result.success) {
                        return true;
                    }

                    // Check that all errors have complete structure
                    for (const error of result.errors) {
                        // Must have path (array of strings/numbers)
                        expect(error).toHaveProperty('path');
                        expect(Array.isArray(error.path)).toBe(true);

                        // Must have message (string)
                        expect(error).toHaveProperty('message');
                        expect(typeof error.message).toBe('string');
                        expect(error.message.length).toBeGreaterThan(0);

                        // Must have code (string in dot-notation format or simple string)
                        expect(error).toHaveProperty('code');
                        expect(typeof error.code).toBe('string');
                        expect(error.code.length).toBeGreaterThan(0);

                        // Meta is optional, but if present, must be an object
                        if ('meta' in error && error.meta !== undefined) {
                            expect(typeof error.meta).toBe('object');
                            expect(error.meta).not.toBeNull();
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 23: All validation errors are returned
    // Feature: wenfit-validator, Property 23: All validation errors are returned
    // Validates: Requirements 12.5
    test('Property 23: all validation errors are returned for inputs with multiple failures', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.integer(), // wrong type
                    age: fc.string(),   // wrong type
                    email: fc.integer() // wrong type
                }),
                (input) => {
                    const schema = object({
                        name: string(),
                        age: number(),
                        email: string().email()
                    });

                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should have multiple errors (at least 3 for the 3 wrong types)
                        expect(result.errors.length).toBeGreaterThanOrEqual(3);

                        // Check that errors are for different paths
                        const paths = result.errors.map(e => e.path.join('.'));
                        expect(paths).toContain('name');
                        expect(paths).toContain('age');
                        expect(paths).toContain('email');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 36: Malformed input handled gracefully
    // Feature: wenfit-validator, Property 36: Malformed input handled gracefully
    // Validates: Requirements 24.5
    test('Property 36: malformed input is handled gracefully without crashing', () => {
        fc.assert(
            fc.property(
                fc.anything(), // Any possible input including malformed
                fc.constantFrom(
                    string(),
                    number(),
                    object({ name: string() }),
                    array(string()),
                    string().email(),
                    number().int(),
                    string().min(5)
                ),
                (input, schema) => {
                    // safeParse should never throw, even with malformed input
                    expect(() => schema.safeParse(input)).not.toThrow();

                    const result = schema.safeParse(input);

                    // Should always return a valid result structure
                    expect(result).toHaveProperty('success');
                    expect(typeof result.success).toBe('boolean');

                    if (!result.success) {
                        // Errors should be well-formed
                        expect(Array.isArray(result.errors)).toBe(true);
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Each error should have the required structure
                        for (const error of result.errors) {
                            expect(error).toHaveProperty('path');
                            expect(error).toHaveProperty('message');
                            expect(error).toHaveProperty('code');
                            expect(typeof error.message).toBe('string');
                            expect(error.message.length).toBeGreaterThan(0);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Circular reference detection
    test('circular references are detected and handled gracefully', () => {
        const schema = object({
            name: string(),
            child: object({ name: string() }).optional()
        });

        // Create circular reference
        const circular: any = { name: 'parent' };
        circular.child = circular;

        // Should not crash or hang
        expect(() => schema.safeParse(circular)).not.toThrow();

        const result = schema.safeParse(circular);

        // Should fail with circular reference error
        expect(result.success).toBe(false);
        if (!result.success) {
            const circularError = result.errors.find(e => e.code === 'circular_reference');
            expect(circularError).toBeDefined();
        }
    });

    // Additional test: Large arrays don't cause stack overflow
    test('large arrays are handled without stack overflow', () => {
        const schema = array(number());

        // Create a large array (10,000 elements)
        const largeArray = Array.from({ length: 10000 }, (_, i) => i);

        // Should not crash
        expect(() => schema.safeParse(largeArray)).not.toThrow();

        const result = schema.safeParse(largeArray);

        // Should succeed
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(10000);
        }
    });

    // Additional test: NaN is handled gracefully
    test('NaN is handled gracefully in number schema', () => {
        const schema = number();

        const result = schema.safeParse(NaN);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe('invalid_type');
            expect(result.errors[0].message).toContain('NaN');
        }
    });

    // Additional test: Invalid Date is handled gracefully
    test('invalid Date is handled gracefully', () => {
        const schema = date();

        const invalidDate = new Date('invalid');
        const result = schema.safeParse(invalidDate);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe('invalid_type');
            expect(result.errors[0].message).toContain('Invalid');
        }
    });
});
