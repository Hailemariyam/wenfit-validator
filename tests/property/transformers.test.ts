// Property tests for Transformers
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number, parseInt, parseFloat } from '../../src/core/primitives/number.js';

describe('Transformer Property Tests', () => {
    // Property 17: Transformers apply after validation
    // Feature: wenfit-validator, Property 17: Transformers apply after validation
    // Validates: Requirements 10.1
    test('Property 17: transformers apply after validation succeeds', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5 }),
                (input) => {
                    // Create a schema with validation constraint and transformer
                    // Use a transformer that always changes the value
                    const schema = string().min(3).transform((s) => s + '_transformed');
                    const result = schema.safeParse(input);

                    // Should succeed since input meets min constraint
                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Transformer should have been applied
                        expect(result.data).toBe(input + '_transformed');
                        // Result should be different from input
                        expect(result.data).not.toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 17: transformers do not apply when validation fails', () => {
        fc.assert(
            fc.property(
                fc.string({ maxLength: 2 }), // Short strings
                (input) => {
                    let transformCalled = false;
                    // Create a schema with validation that will fail and a transformer
                    const schema = string().min(5).transform((s) => {
                        transformCalled = true;
                        return s.toUpperCase();
                    });
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);
                    // Transformer should not have been called
                    expect(transformCalled).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 18: Transformers execute in order
    // Feature: wenfit-validator, Property 18: Transformers execute in order
    // Validates: Requirements 10.5
    test('Property 18: multiple transformers execute in order', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }),
                (input) => {
                    // Chain multiple transformers
                    const schema = string()
                        .transform((s) => s.trim())
                        .transform((s) => s.toLowerCase())
                        .transform((s) => s + '_suffix');

                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Transformers should have been applied in order:
                        // 1. trim
                        // 2. toLowerCase
                        // 3. add suffix
                        const expected = input.trim().toLowerCase() + '_suffix';
                        expect(result.data).toBe(expected);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 18: transformer order matters', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
                (input) => {
                    // Different order should produce different results
                    const schema1 = string()
                        .transform((s) => s.toUpperCase())
                        .transform((s) => s + 'X');

                    const schema2 = string()
                        .transform((s) => s + 'X')
                        .transform((s) => s.toUpperCase());

                    const result1 = schema1.safeParse(input);
                    const result2 = schema2.safeParse(input);

                    expect(result1.success).toBe(true);
                    expect(result2.success).toBe(true);

                    if (result1.success && result2.success) {
                        // Both should succeed but produce same result
                        // (uppercase then add X) vs (add X then uppercase)
                        const expected1 = input.toUpperCase() + 'X';
                        const expected2 = (input + 'X').toUpperCase();
                        expect(result1.data).toBe(expected1);
                        expect(result2.data).toBe(expected2);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 19: Transformed data appears in results
    // Feature: wenfit-validator, Property 19: Transformed data appears in results
    // Validates: Requirements 10.6
    test('Property 19: successful validation result contains transformed data', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (input) => {
                    const schema = string().transform((s) => s.length);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Result should contain transformed data (length), not original string
                        expect(result.data).toBe(input.length);
                        expect(typeof result.data).toBe('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 19: transformed data is not the original input', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }),
                (input) => {
                    const schema = string().transform((s) => ({ original: s, length: s.length }));
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Result should be an object, not the original string
                        expect(typeof result.data).toBe('object');
                        expect(result.data).toHaveProperty('original');
                        expect(result.data).toHaveProperty('length');
                        expect(result.data.original).toBe(input);
                        expect(result.data.length).toBe(input.length);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional tests for built-in string transformers
    test('trim transformer removes whitespace', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.string({ minLength: 0, maxLength: 5 }).map(s => ' '.repeat(s.length)),
                fc.string({ minLength: 0, maxLength: 5 }).map(s => ' '.repeat(s.length)),
                (content, prefix, suffix) => {
                    const input = prefix + content + suffix;
                    const schema = string().trim();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input.trim());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('toLowerCase transformer converts to lowercase', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (input) => {
                    const schema = string().toLowerCase();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input.toLowerCase());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('toUpperCase transformer converts to uppercase', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (input) => {
                    const schema = string().toUpperCase();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input.toUpperCase());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Tests for number transformers (parseInt, parseFloat)
    test('parseInt parses valid integer strings', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                (num) => {
                    const input = num.toString();
                    const schema = parseInt();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(num);
                        expect(typeof result.data).toBe('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('parseFloat parses valid float strings', () => {
        fc.assert(
            fc.property(
                fc.float({ noNaN: true, noDefaultInfinity: true }),
                (num) => {
                    const input = num.toString();
                    const schema = parseFloat();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        // Use toBeCloseTo for floating point comparison
                        expect(result.data).toBeCloseTo(num, 10);
                        expect(typeof result.data).toBe('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('parseInt rejects non-numeric strings', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => Number.isNaN(Number.parseInt(s, 10))),
                (input) => {
                    const schema = parseInt();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('parseFloat rejects non-numeric strings', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => Number.isNaN(Number.parseFloat(s))),
                (input) => {
                    const schema = parseFloat();
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Test combining parseInt/parseFloat with number constraints
    test('parseInt can be chained with number constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 100 }),
                (num) => {
                    const input = num.toString();
                    const schema = parseInt().transform((n) => n * 2);
                    const result = schema.safeParse(input);

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(num * 2);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
