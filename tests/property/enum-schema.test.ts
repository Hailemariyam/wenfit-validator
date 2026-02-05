// Property tests for EnumSchema
// Feature: wenfit-validator

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { enumSchema } from '../../src/core/primitives/enum.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('EnumSchema Property Tests', () => {
    // Property 5: Enum validation accepts only allowed values
    // Feature: wenfit-validator, Property 5: Enum validation accepts only allowed values
    // Validates: Requirements 5.1
    test('Property 5: enum schema accepts only allowed values', () => {
        fc.assert(
            fc.property(
                fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 10 }),
                fc.anything(),
                (allowedValues, input) => {
                    // Ensure we have at least one value and no duplicates
                    const uniqueValues = [...new Set(allowedValues)];
                    if (uniqueValues.length === 0) return;

                    const schema = enumSchema(uniqueValues as [string | number, ...(string | number)[]]);
                    const result = schema.safeParse(input);

                    // Check if input is in allowed values
                    const isAllowed = uniqueValues.includes(input as string | number);

                    if (isAllowed) {
                        // Should pass validation
                        expect(result.success).toBe(true);
                        if (result.success) {
                            expect(result.data).toBe(input);
                        }
                    } else {
                        // Should fail validation
                        expect(result.success).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 6: Enum errors include metadata
    // Feature: wenfit-validator, Property 6: Enum errors include metadata
    // Validates: Requirements 5.4
    test('Property 6: enum validation errors include allowed values in metadata', () => {
        fc.assert(
            fc.property(
                fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 10 }),
                fc.anything(),
                (allowedValues, input) => {
                    // Ensure we have at least one value and no duplicates
                    const uniqueValues = [...new Set(allowedValues)];
                    if (uniqueValues.length === 0) return;

                    const schema = enumSchema(uniqueValues as [string | number, ...(string | number)[]]);
                    const result = schema.safeParse(input);

                    // Check if input is NOT in allowed values
                    const isAllowed = uniqueValues.includes(input as string | number);

                    if (!isAllowed && !result.success) {
                        // Should have enum error
                        const enumError = result.errors.find(e => e.code === ErrorCodes.ENUM_INVALID);
                        expect(enumError).toBeDefined();

                        if (enumError) {
                            // Should include allowed values in metadata
                            expect(enumError.meta).toBeDefined();
                            expect(enumError.meta?.allowedValues).toBeDefined();
                            expect(Array.isArray(enumError.meta?.allowedValues)).toBe(true);
                            expect(enumError.meta?.allowedValues).toEqual(uniqueValues);

                            // Should include received value in metadata
                            expect(enumError.meta?.received).toBe(input);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: string enums work correctly
    test('string enums accept valid values', () => {
        const schema = enumSchema(['red', 'green', 'blue'] as const);

        const redResult = schema.safeParse('red');
        expect(redResult.success).toBe(true);
        if (redResult.success) {
            expect(redResult.data).toBe('red');
        }

        const greenResult = schema.safeParse('green');
        expect(greenResult.success).toBe(true);

        const blueResult = schema.safeParse('blue');
        expect(blueResult.success).toBe(true);
    });

    // Additional test: string enums reject invalid values
    test('string enums reject invalid values', () => {
        const schema = enumSchema(['red', 'green', 'blue'] as const);

        const result = schema.safeParse('yellow');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe(ErrorCodes.ENUM_INVALID);
            expect(result.errors[0].meta?.allowedValues).toEqual(['red', 'green', 'blue']);
        }
    });

    // Additional test: number // Additional test: number enums reject invalid values
    test('number enums reject invalid values', () => {
        const schema = enumSchema([1, 2, 3] as const);

        const result = schema.safeParse(4);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors[0].code).toBe(ErrorCodes.ENUM_INVALID);
            expect(result.errors[0].meta?.allowedValues).toEqual([1, 2, 3]);
        }
    });

    // Additional test: mixed string/number enums work correctly
    test('mixed string/number enums work correctly', () => {
        const schema = enumSchema(['active', 1, 'inactive', 0] as const);

        expect(schema.safeParse('active').success).toBe(true);
        expect(schema.safeParse(1).success).toBe(true);
        expect(schema.safeParse('inactive').success).toBe(true);
        expect(schema.safeParse(0).success).toBe(true);

        expect(schema.safeParse('pending').success).toBe(false);
        expect(schema.safeParse(2).success).toBe(false);
    });
});
