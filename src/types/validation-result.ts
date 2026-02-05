// Validation result types

import type { ValidationErrorData } from '../errors/validation-error.js';

/**
 * Result of a validation operation
 * Either success with data or failure with errors
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: ValidationErrorData[] };

/**
 * Internal parse result type
 * Can be a value, a Promise, or INVALID symbol
 */
export type ParseResult<T> = T | Promise<T> | typeof INVALID;

/**
 * Symbol representing invalid parse result
 */
export const INVALID = Symbol('INVALID');
