// Property tests for error message customization and i18n
// Feature: wenfit-validator

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { string } from '../../src/core/primitives/string.js';
import { number } from '../../src/core/primitives/number.js';
import { array } from '../../src/core/array.js';
import { setErrorMessages, clearErrorMessages } from '../../src/errors/index.js';

describe('Message Customization Property Tests', () => {
    // Clear custom messages before and after each test
    beforeEach(() => {
        clearErrorMessages();
    });

    afterEach(() => {
        clearErrorMessages();
    });

    // Property 26: Custom message templates are used
    // Feature: wenfit-validator, Property 26: Custom message templates are used
    // Validates: Requirements 19.3
    test('Property 26: custom message templates are used instead of default messages', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length < 5), // Generate strings shorter than 5
                (input) => {
                    // Set a custom message template for string.min
                    const customMessage = 'Custom: String is too short';
                    setErrorMessages({
                        'string.min': customMessage,
                    });

                    const schema = string().min(5);
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should use custom message, not default
                        const error = result.errors.find(e => e.code === 'string.min');
                        expect(error).toBeDefined();
                        expect(error?.message).toBe(customMessage);
                        expect(error?.message).not.toContain('String must be at least');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 27: Message templates substitute placeholders
    // Feature: wenfit-validator, Property 27: Message templates substitute placeholders
    // Validates: Requirements 19.4
    test('Property 27: message templates substitute placeholders with actual values', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 20 }), // min value
                fc.integer({ min: 0, max: 19 }), // actual value (less than min)
                (minValue, actualValue) => {
                    // Ensure actual is less than min
                    if (actualValue >= minValue) {
                        return true; // Skip this case
                    }

                    // Set a custom message template with placeholders
                    setErrorMessages({
                        'number.min': 'Value must be at least {{min}}, but got {{actual}}',
                    });

                    const schema = number().min(minValue);
                    const result = schema.safeParse(actualValue);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should substitute placeholders
                        const error = result.errors.find(e => e.code === 'number.min');
                        expect(error).toBeDefined();
                        expect(error?.message).toBe(`Value must be at least ${minValue}, but got ${actualValue}`);
                        expect(error?.message).toContain(String(minValue));
                        expect(error?.message).toContain(String(actualValue));
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Per-schema messages override global templates
    test('per-schema custom messages override global templates', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length < 3),
                (input) => {
                    // Set a global template
                    setErrorMessages({
                        'string.min': 'Global: String is too short',
                    });

                    // Create schema with per-schema message
                    const perSchemaMessage = 'Per-schema: This specific field is too short';
                    const schema = string().min(3, perSchemaMessage);
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should use per-schema message, not global template
                        const error = result.errors.find(e => e.code === 'string.min');
                        expect(error).toBeDefined();
                        expect(error?.message).toBe(perSchemaMessage);
                        expect(error?.message).not.toContain('Global');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Multiple placeholders are substituted
    test('multiple placeholders in templates are substituted correctly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }), // min
                fc.integer({ min: 11, max: 20 }), // max
                fc.integer({ min: 21, max: 30 }), // actual (out of range)
                (min, max, actual) => {
                    // Set template with multiple placeholders
                    setErrorMessages({
                        'number.max': 'Number {{actual}} is out of range [{{min}}, {{max}}]',
                    });

                    const schema = number().min(min).max(max);
                    const result = schema.safeParse(actual);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should substitute all placeholders
                        const error = result.errors.find(e => e.code === 'number.max');
                        expect(error).toBeDefined();
                        // Note: min is not in the meta for number.max, so it won't be substituted
                        expect(error?.message).toContain(String(actual));
                        expect(error?.message).toContain(String(max));
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Function-based templates work correctly
    test('function-based message templates work correctly', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer(), { minLength: 0, maxLength: 2 }),
                (input) => {
                    // Set a function-based template
                    setErrorMessages({
                        'array.min': (meta) => {
                            const min = meta?.min ?? 0;
                            const actual = meta?.actual ?? 0;
                            return `Array needs ${min - actual} more elements`;
                        },
                    });

                    const schema = array(number()).min(3);
                    const result = schema.safeParse(input);

                    // Should fail validation
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        // Should use function-generated message
                        const error = result.errors.find(e => e.code === 'array.min');
                        expect(error).toBeDefined();
                        const expectedDiff = 3 - input.length;
                        expect(error?.message).toBe(`Array needs ${expectedDiff} more elements`);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Templates work for different error codes
    test('custom templates work for various error codes', () => {
        // Set templates for multiple error codes
        setErrorMessages({
            'string.email': 'Please provide a valid email address',
            'string.url': 'Please provide a valid URL',
            'number.int': 'Only whole numbers are allowed',
            'array.max': 'Too many items (max: {{max}})',
        });

        // Test email
        const emailSchema = string().email();
        const emailResult = emailSchema.safeParse('not-an-email');
        expect(emailResult.success).toBe(false);
        if (!emailResult.success) {
            expect(emailResult.errors[0].message).toBe('Please provide a valid email address');
        }

        // Test URL
        const urlSchema = string().url();
        const urlResult = urlSchema.safeParse('not-a-url');
        expect(urlResult.success).toBe(false);
        if (!urlResult.success) {
            expect(urlResult.errors[0].message).toBe('Please provide a valid URL');
        }

        // Test integer
        const intSchema = number().int();
        const intResult = intSchema.safeParse(3.14);
        expect(intResult.success).toBe(false);
        if (!intResult.success) {
            expect(intResult.errors[0].message).toBe('Only whole numbers are allowed');
        }

        // Test array max
        const arraySchema = array(number()).max(2);
        const arrayResult = arraySchema.safeParse([1, 2, 3]);
        expect(arrayResult.success).toBe(false);
        if (!arrayResult.success) {
            const error = arrayResult.errors.find(e => e.code === 'array.max');
            expect(error?.message).toBe('Too many items (max: 2)');
        }
    });

    // Additional test: Clearing templates restores defaults
    test('clearing custom templates restores default messages', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length < 5),
                (input) => {
                    // Set custom template
                    setErrorMessages({
                        'string.min': 'Custom message',
                    });

                    let schema = string().min(5);
                    let result = schema.safeParse(input);

                    // Should use custom message
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors[0].message).toBe('Custom message');
                    }

                    // Clear templates
                    clearErrorMessages();

                    // Should now use default message
                    schema = string().min(5);
                    result = schema.safeParse(input);

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.errors[0].message).toContain('String must be at least');
                        expect(result.errors[0].message).not.toBe('Custom message');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
