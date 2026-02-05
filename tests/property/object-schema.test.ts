// Property tests for ObjectSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { object } from '../../src/core/object.js';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { boolean } from '../../src/core/primitives/boolean.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('ObjectSchema Property Tests', () => {
    // Property 7: Object schemas validate all properties
    // Feature: wenfit-validator, Property 7: Object schemas validate all properties
    // Validates: Requirements 6.1
    test('Property 7: object schemas validate all properties according to their schemas', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                (strValue, numValue, boolValue) => {
                    const schema = object({
                        name: string(),
                        age: number(),
                        active: boolean(),
                    });

                    const input = {
                        name: strValue,
                        age: numValue,
                        active: boolValue,
                    };

                    const result = schema.safeParse(input);

                    // Should succeed for valid input
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.data.name).toBe(strValue);
                        expect(result.data.age).toBe(numValue);
                        expect(result.data.active).toBe(boolValue);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 7: object schemas reject invalid property types', () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
                fc.integer(),
                (invalidName, age) => {
                    const schema = object({
                        name: string(),
                        age: number(),
                    });

                    const input = {
                        name: invalidName,
                        age: age,
                    };

                    const result = schema.safeParse(input);

                    // Should fail because name is not a string
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Should have a type error for the name property
                        const nameError = result.errors.find(e =>
                            e.path.includes('name') && e.code === ErrorCodes.INVALID_TYPE
                        );
                        expect(nameError).toBeDefined();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 8: Error paths track nested locations
    // Feature: wenfit-validator, Property 8: Error paths track nested locations
    // Validates: Requirements 6.2, 7.3, 12.3
    test('Property 8: error paths track nested property locations', () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
                (invalidValue) => {
                    const schema = object({
                        user: object({
                            profile: object({
                                name: string(),
                            }),
                        }),
                    });

                    const input = {
                        user: {
                            profile: {
                                name: invalidValue,
                            },
                        },
                    };

                    const result = schema.safeParse(input);

                    // Should fail because name is not a string
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have at least one error
                        expect(result.errors.length).toBeGreaterThan(0);

                        // Error path should track the nested location
                        const nameError = result.errors.find(e => e.code === ErrorCodes.INVALID_TYPE);
                        expect(nameError).toBeDefined();
                        if (nameError) {
                            expect(nameError.path).toEqual(['user', 'profile', 'name']);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 9: Missing required properties produce errors
    // Feature: wenfit-validator, Property 9: Missing required properties produce errors
    // Validates: Requirements 6.5
    test('Property 9: missing required properties produce REQUIRED error code', () => {
        fc.assert(
            fc.property(
                fc.string(),
                (nameValue) => {
                    const schema = object({
                        name: string(),
                        age: number(),
                        email: string(),
                    });

                    // Input missing 'age' and 'email' properties
                    const input = {
                        name: nameValue,
                    };

                    const result = schema.safeParse(input);

                    // Should fail because required properties are missing
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        // Should have errors for missing properties
                        const requiredErrors = result.errors.filter(e => e.code === ErrorCodes.REQUIRED);
                        expect(requiredErrors.length).toBeGreaterThanOrEqual(2);

                        // Check that error paths include the missing property names
                        const errorPaths = requiredErrors.map(e => e.path[0]);
                        expect(errorPaths).toContain('age');
                        expect(errorPaths).toContain('email');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
