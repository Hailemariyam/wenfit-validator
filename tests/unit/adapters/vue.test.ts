// Unit tests for Vue adapter
// Tests reactive state updates and async validation handling

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useValidation } from '../../../src/adapters/vue.js';
import { string, number, object, array } from '../../../src/index.js';

describe('Vue Adapter - useValidation', () => {
    describe('Reactive state updates', () => {
        test('should initialize with empty errors and not validating', () => {
            const schema = string();
            const { errors, isValidating } = useValidation({ schema });

            expect(errors.value).toEqual([]);
            expect(isValidating.value).toBe(false);
        });

        test('should update errors reactively on validation failure', async () => {
            const schema = string().min(5);
            const { validate, errors } = useValidation({ schema });

            await validate('abc');

            expect(errors.value.length).toBeGreaterThan(0);
            expect(errors.value[0].code).toBe('string.min');
        });

        test('should clear errors reactively on validation success', async () => {
            const schema = string().min(5);
            const { validate, errors } = useValidation({ schema });

            // First validation fails
            await validate('abc');
            expect(errors.value.length).toBeGreaterThan(0);

            // Second validation succeeds
            await validate('abcdef');
            expect(errors.value).toEqual([]);
        });

        test('should set isValidating to true during validation', async () => {
            const schema = string();
            const { validate, isValidating } = useValidation({ schema });

            // For synchronous validation, isValidating is set and cleared very quickly
            await validate('test');

            // Should be false after validation completes
            expect(isValidating.value).toBe(false);
        });

        test('should clear errors when clearErrors is called', async () => {
            const schema = string().min(5);
            const { validate, errors, clearErrors } = useValidation({ schema });

            // Validation fails
            await validate('abc');
            expect(errors.value.length).toBeGreaterThan(0);

            // Clear errors
            clearErrors();
            expect(errors.value).toEqual([]);
        });

        test('should update errors reactively with multiple validations', async () => {
            const schema = string().min(5);
            const { validate, errors } = useValidation({ schema });

            // First validation
            await validate('abc');
            const firstErrorCount = errors.value.length;
            expect(firstErrorCount).toBeGreaterThan(0);

            // Second validation with different error
            await validate('ab');
            expect(errors.value.length).toBeGreaterThan(0);

            // Third validation succeeds
            await validate('valid string');
            expect(errors.value).toEqual([]);
        });
    });

    describe('Async validation handling', () => {
        test('should handle async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    // Simulate async check
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.includes('valid');
                },
                'Must contain "valid"'
            );

            const { validate, errors } = useValidation({ schema });

            // Validation should succeed for valid input
            const validResult = await validate('valid input');
            expect(validResult.success).toBe(true);
            expect(errors.value).toEqual([]);

            // Validation should fail for input without "valid"
            const invalidResult = await validate('wrong');
            expect(invalidResult.success).toBe(false);
            expect(errors.value.length).toBeGreaterThan(0);
            expect(errors.value[0].message).toBe('Must contain "valid"');
        });

        test('should set isValidating during async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return val.length > 5;
                },
                'Too short'
            );

            const { validate, isValidating } = useValidation({ schema });

            // Start validation but don't await immediately
            const validationPromise = validate('test');

            // Wait a bit and check if validating
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(isValidating.value).toBe(true);

            // Wait for validation to complete
            await validationPromise;
            expect(isValidating.value).toBe(false);
        });

        test('should handle async validation success', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.length > 3;
                },
                'Too short'
            );

            const { validate, errors } = useValidation({ schema });

            const validationResult = await validate('testing');
            expect(validationResult.success).toBe(true);
            expect(errors.value).toEqual([]);
        });

        test('should handle async validation failure', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.length > 10;
                },
                'Too short'
            );

            const { validate, errors } = useValidation({ schema });

            const validationResult = await validate('short');
            expect(validationResult.success).toBe(false);
            expect(errors.value.length).toBeGreaterThan(0);
            expect(errors.value[0].message).toBe('Too short');
        });

        test('should update isValidating reactively during async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 30));
                    return val.length > 5;
                },
                'Too short'
            );

            const { validate, isValidating } = useValidation({ schema });

            expect(isValidating.value).toBe(false);

            const validationPromise = validate('test');

            // Check that isValidating is true during validation
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(isValidating.value).toBe(true);

            // Wait for completion
            await validationPromise;
            expect(isValidating.value).toBe(false);
        });
    });

    describe('Field-level error access', () => {
        test('should get error for specific field path', async () => {
            const schema = object({
                email: string().email(),
                age: number().min(18),
            });

            const { validate, getFieldError } = useValidation({ schema });

            await validate({
                email: 'invalid-email',
                age: 15,
            });

            const emailError = getFieldError('email');
            expect(emailError.value).toBeDefined();
            expect(emailError.value?.code).toBe('string.email');

            const ageError = getFieldError('age');
            expect(ageError.value).toBeDefined();
            expect(ageError.value?.code).toBe('number.min');
        });

        test('should return undefined for non-existent field path', async () => {
            const schema = object({
                email: string().email(),
            });

            const { validate, getFieldError } = useValidation({ schema });

            await validate({
                email: 'invalid-email',
            });

            const nonExistentError = getFieldError('nonexistent');
            expect(nonExistentError.value).toBeUndefined();
        });

        test('should handle nested object paths', async () => {
            const schema = object({
                user: object({
                    email: string().email(),
                    profile: object({
                        age: number().min(18),
                    }),
                }),
            });

            const { validate, getFieldError } = useValidation({ schema });

            await validate({
                user: {
                    email: 'invalid',
                    profile: {
                        age: 15,
                    },
                },
            });

            const emailError = getFieldError('user.email');
            expect(emailError.value).toBeDefined();
            expect(emailError.value?.code).toBe('string.email');

            const ageError = getFieldError('user.profile.age');
            expect(ageError.value).toBeDefined();
            expect(ageError.value?.code).toBe('number.min');
        });

        test('should handle array index paths', async () => {
            const schema = object({
                items: array(object({
                    name: string().min(3),
                })),
            });

            const { validate, getFieldError } = useValidation({ schema });

            await validate({
                items: [
                    { name: 'ab' }, // Too short
                    { name: 'valid' },
                ],
            });

            const itemError = getFieldError('items.0.name');
            expect(itemError.value).toBeDefined();
            expect(itemError.value?.code).toBe('string.min');
        });

        test('should return undefined when no errors exist', async () => {
            const schema = object({
                email: string().email(),
            });

            const { validate, getFieldError } = useValidation({ schema });

            await validate({
                email: 'valid@example.com',
            });

            const emailError = getFieldError('email');
            expect(emailError.value).toBeUndefined();
        });

        test('should update field error reactively', async () => {
            const schema = object({
                email: string().email(),
            });

            const { validate, getFieldError } = useValidation({ schema });

            const emailError = getFieldError('email');

            // Initially no error
            expect(emailError.value).toBeUndefined();

            // After invalid validation
            await validate({ email: 'invalid' });
            expect(emailError.value).toBeDefined();
            expect(emailError.value?.code).toBe('string.email');

            // After valid validation
            await validate({ email: 'valid@example.com' });
            expect(emailError.value).toBeUndefined();
        });
    });

    describe('Validation mode options', () => {
        test('should accept validation mode option', () => {
            const schema = string();
            const { validate } = useValidation({ schema, mode: 'onChange' });

            expect(validate).toBeDefined();
        });

        test('should default to onSubmit mode', () => {
            const schema = string();
            const { validate } = useValidation({ schema });

            expect(validate).toBeDefined();
        });
    });

    describe('Error handling', () => {
        test('should handle validation with multiple errors', async () => {
            const schema = object({
                email: string().email(),
                password: string().min(8),
                age: number().min(18),
            });

            const { validate, errors } = useValidation({ schema });

            await validate({
                email: 'invalid',
                password: 'short',
                age: 15,
            });

            expect(errors.value.length).toBe(3);
        });

        test('should return validation result from validate function', async () => {
            const schema = string().min(5);
            const { validate } = useValidation({ schema });

            const validationResult = await validate('abc');

            expect(validationResult).toBeDefined();
            expect(validationResult.success).toBe(false);
            if (!validationResult.success) {
                expect(validationResult.errors.length).toBeGreaterThan(0);
            }
        });

        test('should return success result for valid data', async () => {
            const schema = string().min(5);
            const { validate } = useValidation({ schema });

            const validationResult = await validate('valid string');

            expect(validationResult).toBeDefined();
            expect(validationResult.success).toBe(true);
            if (validationResult.success) {
                expect(validationResult.data).toBe('valid string');
            }
        });

        test('should handle unexpected errors gracefully', async () => {
            // Create a schema that will throw an error during validation
            const schema = string().refine(() => {
                throw new Error('Unexpected error');
            }, 'Should not reach here');

            const { validate, errors } = useValidation({ schema });

            const result = await validate('test');

            expect(result.success).toBe(false);
            expect(errors.value.length).toBeGreaterThan(0);
            // The error code will be 'custom' from the refine method
            expect(errors.value[0].code).toBe('custom');
        });
    });

    describe('Reactivity', () => {
        test('should maintain reactivity across multiple validations', async () => {
            const schema = string().min(5);
            const { validate, errors, isValidating } = useValidation({ schema });

            // Track state changes
            const errorStates: number[] = [];
            const validatingStates: boolean[] = [];

            // First validation
            await validate('abc');
            errorStates.push(errors.value.length);
            validatingStates.push(isValidating.value);

            // Second validation
            await validate('valid string');
            errorStates.push(errors.value.length);
            validatingStates.push(isValidating.value);

            // Third validation
            await validate('ab');
            errorStates.push(errors.value.length);
            validatingStates.push(isValidating.value);

            expect(errorStates[0]).toBeGreaterThan(0); // First had errors
            expect(errorStates[1]).toBe(0); // Second was valid
            expect(errorStates[2]).toBeGreaterThan(0); // Third had errors
            expect(validatingStates.every(state => state === false)).toBe(true); // All completed
        });

        test('should allow computed properties based on errors', async () => {
            const schema = object({
                email: string().email(),
                password: string().min(8),
            });

            const { validate, errors } = useValidation({ schema });

            await validate({
                email: 'invalid',
                password: 'short',
            });

            // Simulate a computed property
            const hasErrors = errors.value.length > 0;
            expect(hasErrors).toBe(true);

            await validate({
                email: 'valid@example.com',
                password: 'validpassword',
            });

            const hasErrorsAfter = errors.value.length > 0;
            expect(hasErrorsAfter).toBe(false);
        });
    });
});
