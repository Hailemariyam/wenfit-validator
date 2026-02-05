// Vue adapter for Wenfit Validator
// Provides useValidation composable for Vue form validation

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { Schema } from '../core/schema.js';
import type { ValidationResult } from '../types/validation-result.js';
import type { ValidationErrorData } from '../errors/validation-error.js';

/**
 * Validation mode options
 * - onChange: Validate on every change
 * - onBlur: Validate when field loses focus
 * - onSubmit: Validate only on form submission
 */
export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit';

/**
 * Options for useValidation composable
 */
export interface UseValidationOptions<T> {
    schema: Schema<any, T>;
    mode?: ValidationMode;
}

/**
 * Return type for useValidation composable
 */
export interface UseValidationReturn<T> {
    validate: (data: unknown) => Promise<ValidationResult<T>>;
    errors: Ref<ValidationErrorData[]>;
    isValidating: Ref<boolean>;
    getFieldError: (path: string) => ComputedRef<ValidationErrorData | undefined>;
    clearErrors: () => void;
    mode: ValidationMode;
}

/**
 * Vue composable for form validation with Wenfit Validator
 *
 * @param options - Configuration options including schema and validation mode
 * @returns Validation functions and reactive state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useValidation } from 'wenfit-validator/adapters/vue';
 * import { object, string } from 'wenfit-validator';
 *
 * const { validate, errors, isValidating, getFieldError } = useValidation({
 *   schema: object({
 *     email: string().email(),
 *     password: string().min(8)
 *   })
 * });
 *
 * const handleSubmit = async (data) => {
 *   const result = await validate(data);
 *   if (result.success) {
 *     // Handle valid data
 *   }
 * };
 * </script>
 * ```
 */
export function useValidation<T>(options: UseValidationOptions<T>): UseValidationReturn<T> {
    const { schema, mode = 'onSubmit' } = options;

    // Reactive state for validation errors
    const errors = ref<ValidationErrorData[]>([]) as Ref<ValidationErrorData[]>;

    // Reactive state for validation in progress
    const isValidating = ref(false);

    /**
     * Validate data against the schema
     * Supports both synchronous and asynchronous validation
     */
    const validate = async (data: unknown): Promise<ValidationResult<T>> => {
        // Set validating state
        isValidating.value = true;

        try {
            // Perform validation
            const result = schema.safeParse(data);

            // Handle async validation
            if (result instanceof Promise) {
                const resolvedResult = await result;

                // Update reactive state
                if (resolvedResult.success) {
                    errors.value = [];
                } else {
                    errors.value = resolvedResult.errors;
                }
                isValidating.value = false;

                return resolvedResult;
            }

            // Handle sync validation
            if (result.success) {
                errors.value = [];
            } else {
                errors.value = result.errors;
            }
            isValidating.value = false;

            return result;
        } catch (error) {
            // Handle unexpected errors
            const errorData: ValidationErrorData = {
                path: [],
                message: error instanceof Error ? error.message : 'Validation failed',
                code: 'validation.error',
            };

            errors.value = [errorData];
            isValidating.value = false;

            return {
                success: false,
                errors: [errorData],
            };
        }
    };

    /**
     * Get error for a specific field by path
     * Path can be dot-notation (e.g., "user.email") or array notation (e.g., "items.0.name")
     * Returns a computed ref that updates reactively
     */
    const getFieldError = (path: string): ComputedRef<ValidationErrorData | undefined> => {
        return computed(() => {
            // Convert dot-notation path to array
            const pathArray = path.split('.');

            // Find error matching the path
            return errors.value.find(error => {
                // Check if error path matches the requested path
                if (error.path.length !== pathArray.length) {
                    return false;
                }

                return error.path.every((segment, index) => {
                    return String(segment) === pathArray[index];
                });
            });
        });
    };

    /**
     * Clear all validation errors
     */
    const clearErrors = (): void => {
        errors.value = [];
    };

    return {
        validate,
        errors,
        isValidating,
        getFieldError,
        clearErrors,
        mode,
    };
}
