// React adapter for Wenfit Validator
// Provides useValidator hook for React form validation

import { useState, useCallback, useRef } from 'react';
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
 * Options for useValidator hook
 */
export interface UseValidatorOptions<T> {
    schema: Schema<any, T>;
    mode?: ValidationMode;
}

/**
 * Return type for useValidator hook
 */
export interface UseValidatorReturn<T> {
    validate: (data: unknown) => Promise<ValidationResult<T>>;
    errors: ValidationErrorData[];
    isValidating: boolean;
    getFieldError: (path: string) => ValidationErrorData | undefined;
    clearErrors: () => void;
    mode: ValidationMode;
}

/**
 * React hook for form validation with Wenfit Validator
 *
 * @param options - Configuration options including schema and validation mode
 * @returns Validation functions and state
 *
 * @example
 * ```tsx
 * const { validate, errors, isValidating, getFieldError } = useValidator({
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
 * ```
 */
export function useValidator<T>(options: UseValidatorOptions<T>): UseValidatorReturn<T> {
    const { schema, mode = 'onSubmit' } = options;

    // State for validation errors
    const [errors, setErrors] = useState<ValidationErrorData[]>([]);

    // State for validation in progress
    const [isValidating, setIsValidating] = useState(false);

    // Ref to track if component is mounted (prevent state updates after unmount)
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useState(() => {
        return () => {
            isMountedRef.current = false;
        };
    });

    /**
     * Validate data against the schema
     * Supports both synchronous and asynchronous validation
     */
    const validate = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
        // Set validating state
        if (isMountedRef.current) {
            setIsValidating(true);
        }

        try {
            // Perform validation
            const result = schema.safeParse(data);

            // Handle async validation
            if (result instanceof Promise) {
                const resolvedResult = await result;

                // Update state only if component is still mounted
                if (isMountedRef.current) {
                    if (resolvedResult.success) {
                        setErrors([]);
                    } else {
                        setErrors(resolvedResult.errors);
                    }
                    setIsValidating(false);
                }

                return resolvedResult;
            }

            // Handle sync validation
            if (isMountedRef.current) {
                if (result.success) {
                    setErrors([]);
                } else {
                    setErrors(result.errors);
                }
                setIsValidating(false);
            }

            return result;
        } catch (error) {
            // Handle unexpected errors
            const errorData: ValidationErrorData = {
                path: [],
                message: error instanceof Error ? error.message : 'Validation failed',
                code: 'validation.error',
            };

            if (isMountedRef.current) {
                setErrors([errorData]);
                setIsValidating(false);
            }

            return {
                success: false,
                errors: [errorData],
            };
        }
    }, [schema]);

    /**
     * Get error for a specific field by path
     * Path can be dot-notation (e.g., "user.email") or array notation (e.g., "items.0.name")
     */
    const getFieldError = useCallback((path: string): ValidationErrorData | undefined => {
        // Convert dot-notation path to array
        const pathArray = path.split('.');

        // Find error matching the path
        return errors.find(error => {
            // Check if error path matches the requested path
            if (error.path.length !== pathArray.length) {
                return false;
            }

            return error.path.every((segment, index) => {
                return String(segment) === pathArray[index];
            });
        });
    }, [errors]);

    /**
     * Clear all validation errors
     */
    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    return {
        validate,
        errors,
        isValidating,
        getFieldError,
        clearErrors,
        mode,
    };
}
