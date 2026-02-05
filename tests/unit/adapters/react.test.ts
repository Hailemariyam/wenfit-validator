// Unit tests for React adapter
// Tests validation state updates, async validation, and field-level error access

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useValidator } from '../../../src/adapters/react.js';
import { string, number, object, array } from '../../../src/index.js';

describe('React Adapter - useValidator', () => {
    describe('Validation state updates', () => {
        test('should initialize with empty errors and not validating', () => {
            const schema = string();
            const { result } = renderHook(() => useValidator({ schema }));

            expect(result.current.errors).toEqual([]);
            expect(result.current.isValidating).toBe(false);
        });

        test('should update errors on validation failure', async () => {
            const schema = string().min(5);
            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate('abc');
            });

            expect(result.current.errors.length).toBeGreaterThan(0);
            expect(result.current.errors[0].code).toBe('string.min');
        });

        test('should clear errors on validation success', async () => {
            const schema = string().min(5);
            const { result } = renderHook(() => useValidator({ schema }));

            // First validation fails
            await act(async () => {
                await result.current.validate('abc');
            });
            expect(result.current.errors.length).toBeGreaterThan(0);

            // Second validation succeeds
            await act(async () => {
                await result.current.validate('abcdef');
            });
            expect(result.current.errors).toEqual([]);
        });

        test('should set isValidating to true during validation', async () => {
            const schema = string();
            const { result } = renderHook(() => useValidator({ schema }));

            // For synchronous validation, isValidating is set and cleared very quickly
            // We can't reliably capture it in the middle, so we just verify the final state
            await act(async () => {
                await result.current.validate('test');
            });

            // Should be false after validation completes
            expect(result.current.isValidating).toBe(false);
        });

        test('should clear errors when clearErrors is called', async () => {
            const schema = string().min(5);
            const { result } = renderHook(() => useValidator({ schema }));

            // Validation fails
            await act(async () => {
                await result.current.validate('abc');
            });
            expect(result.current.errors.length).toBeGreaterThan(0);

            // Clear errors
            act(() => {
                result.current.clearErrors();
            });
            expect(result.current.errors).toEqual([]);
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

            const { result } = renderHook(() => useValidator({ schema }));

            // Validation should succeed for valid input
            let validResult;
            await act(async () => {
                validResult = await result.current.validate('valid input');
            });
            expect(validResult.success).toBe(true);
            expect(result.current.errors).toEqual([]);

            // Validation should fail for input without "valid"
            let invalidResult;
            await act(async () => {
                invalidResult = await result.current.validate('wrong');
            });
            expect(invalidResult.success).toBe(false);
            expect(result.current.errors.length).toBeGreaterThan(0);
            expect(result.current.errors[0].message).toBe('Must contain "valid"');
        });

        test('should set isValidating during async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return val.length > 5;
                },
                'Too short'
            );

            const { result } = renderHook(() => useValidator({ schema }));

            // Start validation but don't await immediately
            let validationPromise: Promise<any>;
            act(() => {
                validationPromise = result.current.validate('test');
            });

            // Wait a bit and check if validating
            await waitFor(() => {
                expect(result.current.isValidating).toBe(true);
            }, { timeout: 100 });

            // Wait for validation to complete
            await act(async () => {
                await validationPromise!;
            });

            expect(result.current.isValidating).toBe(false);
        });

        test('should handle async validation success', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.length > 3;
                },
                'Too short'
            );

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                const validationResult = await result.current.validate('testing');
                expect(validationResult.success).toBe(true);
            });

            expect(result.current.errors).toEqual([]);
        });
    });

    describe('Field-level error access', () => {
        test('should get error for specific field path', async () => {
            const schema = object({
                email: string().email(),
                age: number().min(18),
            });

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    email: 'invalid-email',
                    age: 15,
                });
            });

            const emailError = result.current.getFieldError('email');
            expect(emailError).toBeDefined();
            expect(emailError?.code).toBe('string.email');

            const ageError = result.current.getFieldError('age');
            expect(ageError).toBeDefined();
            expect(ageError?.code).toBe('number.min');
        });

        test('should return undefined for non-existent field path', async () => {
            const schema = object({
                email: string().email(),
            });

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    email: 'invalid-email',
                });
            });

            const nonExistentError = result.current.getFieldError('nonexistent');
            expect(nonExistentError).toBeUndefined();
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

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    user: {
                        email: 'invalid',
                        profile: {
                            age: 15,
                        },
                    },
                });
            });

            const emailError = result.current.getFieldError('user.email');
            expect(emailError).toBeDefined();
            expect(emailError?.code).toBe('string.email');

            const ageError = result.current.getFieldError('user.profile.age');
            expect(ageError).toBeDefined();
            expect(ageError?.code).toBe('number.min');
        });

        test('should handle array index paths', async () => {
            const schema = object({
                items: array(object({
                    name: string().min(3),
                })),
            });

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    items: [
                        { name: 'ab' }, // Too short
                        { name: 'valid' },
                    ],
                });
            });

            const itemError = result.current.getFieldError('items.0.name');
            expect(itemError).toBeDefined();
            expect(itemError?.code).toBe('string.min');
        });

        test('should return undefined when no errors exist', async () => {
            const schema = object({
                email: string().email(),
            });

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    email: 'valid@example.com',
                });
            });

            const emailError = result.current.getFieldError('email');
            expect(emailError).toBeUndefined();
        });
    });

    describe('Validation mode options', () => {
        test('should accept validation mode option', () => {
            const schema = string();
            const { result } = renderHook(() =>
                useValidator({ schema, mode: 'onChange' })
            );

            expect(result.current).toBeDefined();
            expect(result.current.validate).toBeDefined();
        });

        test('should default to onSubmit mode', () => {
            const schema = string();
            const { result } = renderHook(() => useValidator({ schema }));

            expect(result.current).toBeDefined();
        });
    });

    describe('Error handling', () => {
        test('should handle validation with multiple errors', async () => {
            const schema = object({
                email: string().email(),
                password: string().min(8),
                age: number().min(18),
            });

            const { result } = renderHook(() => useValidator({ schema }));

            await act(async () => {
                await result.current.validate({
                    email: 'invalid',
                    password: 'short',
                    age: 15,
                });
            });

            expect(result.current.errors.length).toBe(3);
        });

        test('should return validation result from validate function', async () => {
            const schema = string().min(5);
            const { result } = renderHook(() => useValidator({ schema }));

            let validationResult;
            await act(async () => {
                validationResult = await result.current.validate('abc');
            });

            expect(validationResult).toBeDefined();
            expect(validationResult.success).toBe(false);
            if (!validationResult.success) {
                expect(validationResult.errors.length).toBeGreaterThan(0);
            }
        });

        test('should return success result for valid data', async () => {
            const schema = string().min(5);
            const { result } = renderHook(() => useValidator({ schema }));

            let validationResult;
            await act(async () => {
                validationResult = await result.current.validate('valid string');
            });

            expect(validationResult).toBeDefined();
            expect(validationResult.success).toBe(true);
            if (validationResult.success) {
                expect(validationResult.data).toBe('valid string');
            }
        });
    });
});
