// Property tests for IntersectionSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { intersection } from '../../src/core/intersection.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { object } from '../../src/core/object.js';

describe('IntersectionSchema Property Tests', () => {
    // Property 13: Intersection requires all members
    // Feature: wenfit-validator, Property 13: Intersection requires all members
    // Validates: Requirements 8.3
    test('Property 13: intersection requires input to satisfy all member schemas', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string(),
                    age: fc.integer({ min: 0, max: 150 }),
                    email: fc.emailAddress(),
                }),
                (input) => {
                    // Create two object schemas with overlapping and distinct properties
                    const schema1 = object({ name: string(), age: number() });
                    const schema2 = object({ name: string(), email: string() });

                    const schema = intersection([schema1, schema2]);
                    const result = schema.safeParse(input);

                    // Should succeed only if input satisfies both schemas
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toHaveProperty('name');
                        expect(result.data).toHaveProperty('age');
                        expect(result.data).toHaveProperty('email');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Intersection fails if any member fails
    test('intersection fails if any member schema fails', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string(),
                    age: fc.integer({ min: 0, max: 150 }),
                }),
                (input) => {
                    // Create schemas where second requires email
                    const schema1 = object({ name: string(), age: number() });
                    const schema2 = object({ name: string(), email: string() });

                    const schema = intersection([schema1, schema2]);
                    const result = schema.safeParse(input);

                    // Should fail because input doesn't have email
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have errors from the failed schema
                        expect(result.errors.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Intersection with constraints
    test('intersection validates all constraints', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 50 }),
                (input) => {
                    // Create two number schemas with different constraints
                    const schema1 = number().min(10);
                    const schema2 = number().max(50);

                    const schema = intersection([schema1, schema2]);
                    const result = schema.safeParse(input);

                    // Should succeed for numbers between 10 and 50
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data).toBe(input);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Intersection fails if first constraint violated
    test('intersection fails if first constraint violated', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 9 }),
                (input) => {
                    const schema1 = number().min(10);
                    const schema2 = number().max(50);

                    const schema = intersection([schema1, schema2]);
                    const result = schema.safeParse(input);

                    // Should fail because input < 10
                    expect(result.success).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Intersection fails if second constraint violated
    test('intersection fails if second constraint violated', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 51, max: 100 }),
                (input) => {
                    const schema1 = number().min(10);
                    const schema2 = number().max(50);

                    const schema = intersection([schema1, schema2]);
                    const result = schema.safeParse(input);

                    // Should fail because input > 50
                    expect(result.success).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Intersection with single schema
    test('intersection with single schema behaves like that schema', () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const schema = intersection([string()]);
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
