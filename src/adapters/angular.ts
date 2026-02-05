// Angular adapter for Wenfit Validator
// Provides ValidationService for Angular reactive forms integration

import { Injectable } from '@angular/core';
import {
    AbstractControl,
    AsyncValidatorFn,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import type { Schema } from '../core/schema.js';
import type { ValidationResult } from '../types/validation-result.js';

/**
 * Injectable validation service for Angular
 * Provides validators compatible with Angular reactive forms
 *
 * @example
 * ```typescript
 * import { Component } from '@angular/core';
 * import { FormBuilder, FormGroup } from '@angular/forms';
 * import { ValidationService } from 'wenfit-validator/adapters/angular';
 * import { string, number, object } from 'wenfit-validator';
 *
 * @Component({
 *   selector: 'app-form',
 *   template: `
 *     <form [formGroup]="form" (ngSubmit)="onSubmit()">
 *       <input formControlName="email" />
 *       <input formControlName="age" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * export class FormComponent {
 *   form: FormGroup;
 *
 *   constructor(
 *     private fb: FormBuilder,
 *     private validationService: ValidationService
 *   ) {
 *     const emailSchema = string().email();
 *     const ageSchema = number().min(18);
 *
 *     this.form = this.fb.group({
 *       email: ['', this.validationService.createValidator(emailSchema)],
 *       age: ['', this.validationService.createValidator(ageSchema)]
 *     });
 *   }
 *
 *   onSubmit() {
 *     if (this.form.valid) {
 *       console.log(this.form.value);
 *     }
 *   }
 * }
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    /**
     * Create a synchronous Angular validator from a Wenfit schema
     * Use this for schemas without async validation rules
     *
     * @param schema - The Wenfit validation schema
     * @returns Angular ValidatorFn
     */
    createValidator<T>(schema: Schema<any, T>): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            // Get the control value
            const value = control.value;

            // Perform validation
            const result = schema.safeParse(value);

            // Handle async validation - should use createAsyncValidator instead
            if (result instanceof Promise) {
                console.warn(
                    'Schema contains async validation. Use createAsyncValidator instead.'
                );
                return null;
            }

            // Return null if validation succeeds
            if (!result.success) {
                // Convert validation errors to Angular format
                return this.convertToAngularErrors(result.errors);
            }

            return null;
        };
    }

    /**
     * Create an asynchronous Angular validator from a Wenfit schema
     * Use this for schemas with async validation rules
     *
     * @param schema - The Wenfit validation schema
     * @returns Angular AsyncValidatorFn
     */
    createAsyncValidator<T>(schema: Schema<any, T>): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            // Get the control value
            const value = control.value;

            // Perform validation
            const result = schema.safeParse(value);

            // Handle async validation
            if (result instanceof Promise) {
                return from(result).pipe(
                    map((resolvedResult: ValidationResult<T>) => {
                        if (!resolvedResult.success) {
                            return this.convertToAngularErrors(resolvedResult.errors);
                        }
                        return null;
                    }),
                    catchError(() => {
                        // If validation throws an error, return a generic error
                        return of({
                            validation: 'Validation failed',
                        });
                    })
                );
            }

            // Handle sync validation (return as Observable)
            if (!result.success) {
                return of(this.convertToAngularErrors(result.errors));
            }

            return of(null);
        };
    }

    /**
     * Validate a form group against a schema
     * Useful for validating entire forms at once
     *
     * @param schema - The Wenfit validation schema
     * @param formValue - The form value to validate
     * @returns ValidationResult
     */
    validateForm<T>(
        schema: Schema<any, T>,
        formValue: any
    ): ValidationResult<T> | Promise<ValidationResult<T>> {
        return schema.safeParse(formValue);
    }

    /**
     * Convert Wenfit validation errors to Angular ValidationErrors format
     * Angular expects errors as a flat object with error keys
     *
     * @param errors - Wenfit validation errors
     * @returns Angular ValidationErrors
     */
    private convertToAngularErrors(
        errors: Array<{ path: (string | number)[]; message: string; code: string }>
    ): ValidationErrors {
        const angularErrors: ValidationErrors = {};

        for (const error of errors) {
            // Use the error code as the key
            // If there's a path, include it in the error key
            const errorKey =
                error.path.length > 0
                    ? `${error.path.join('.')}.${error.code}`
                    : error.code;

            angularErrors[errorKey] = {
                message: error.message,
                path: error.path,
                code: error.code,
            };
        }

        // Also add a general 'validation' key for easy checking
        if (errors.length > 0) {
            angularErrors['validation'] = {
                errors: errors,
            };
        }

        return angularErrors;
    }

    /**
     * Get error message for a specific field from Angular control
     * Helper method to extract Wenfit error messages from Angular form controls
     *
     * @param control - Angular form control
     * @param fieldPath - Optional field path for nested errors
     * @returns Error message or null
     */
    getErrorMessage(control: AbstractControl, fieldPath?: string): string | null {
        if (!control.errors) {
            return null;
        }

        // Look for validation errors
        const validationError = control.errors['validation'];
        if (validationError && validationError.errors) {
            const errors = validationError.errors;

            // If fieldPath is provided, find error for that path
            if (fieldPath) {
                const pathArray = fieldPath.split('.');
                const error = errors.find((e: any) => {
                    return (
                        e.path.length === pathArray.length &&
                        e.path.every((segment: any, index: number) => {
                            return String(segment) === pathArray[index];
                        })
                    );
                });
                return error ? error.message : null;
            }

            // Otherwise return the first error message
            return errors[0]?.message || null;
        }

        // Fallback: return first error message from any error key
        const errorKeys = Object.keys(control.errors);
        if (errorKeys.length > 0) {
            const firstErrorKey = errorKeys[0];
            if (firstErrorKey) {
                const firstError = control.errors[firstErrorKey];
                if (firstError && typeof firstError === 'object' && 'message' in firstError) {
                    return firstError.message;
                }
            }
        }

        return null;
    }
}

/**
 * Standalone function to create a validator from a schema
 * Convenience function that doesn't require injecting ValidationService
 *
 * @param schema - The Wenfit validation schema
 * @returns Angular ValidatorFn
 *
 * @example
 * ```typescript
 * import { createSchemaValidator } from 'wenfit-validator/adapters/angular';
 * import { string } from 'wenfit-validator';
 *
 * this.form = this.fb.group({
 *   email: ['', createSchemaValidator(string().email())],
 * });
 * ```
 */
export function createSchemaValidator<T>(schema: Schema<any, T>): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        const result = schema.safeParse(value);

        if (result instanceof Promise) {
            console.warn(
                'Schema contains async validation. Use createAsyncSchemaValidator instead.'
            );
            return null;
        }

        if (!result.success) {
            return {
                validationErrors: result.errors,
            };
        }

        return null;
    };
}

/**
 * Standalone function to create an async validator from a schema
 * Convenience function that doesn't require injecting ValidationService
 *
 * @param schema - The Wenfit validation schema
 * @returns Angular AsyncValidatorFn
 *
 * @example
 * ```typescript
 * import { createAsyncSchemaValidator } from 'wenfit-validator/adapters/angular';
 * import { string } from 'wenfit-validator';
 *
 * const asyncSchema = string().refine(
 *   async (val) => await checkUnique(val),
 *   'Already exists'
 * );
 *
 * this.form = this.fb.group({
 *   username: ['', [], [createAsyncSchemaValidator(asyncSchema)]],
 * });
 * ```
 */
export function createAsyncSchemaValidator<T>(schema: Schema<any, T>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        const value = control.value;
        const result = schema.safeParse(value);

        if (result instanceof Promise) {
            return from(result).pipe(
                map((resolvedResult: ValidationResult<T>) => {
                    if (!resolvedResult.success) {
                        return {
                            validationErrors: resolvedResult.errors,
                        };
                    }
                    return null;
                }),
                catchError(() => {
                    return of({
                        validationErrors: [
                            {
                                path: [],
                                message: 'Validation failed',
                                code: 'validation_error',
                            },
                        ],
                    });
                })
            );
        }

        if (!result.success) {
            return of({
                validationErrors: result.errors,
            });
        }

        return of(null);
    };
}

/**
 * Standalone function to validate data against a schema
 * Convenience function that doesn't require injecting ValidationService
 *
 * @param schema - The Wenfit validation schema
 * @param data - The data to validate
 * @returns ValidationResult
 *
 * @example
 * ```typescript
 * import { validate } from 'wenfit-validator/adapters/angular';
 * import { object, string } from 'wenfit-validator';
 *
 * const schema = object({ email: string().email() });
 * const result = validate(schema, formData);
 * ```
 */
export function validate<T>(
    schema: Schema<any, T>,
    data: unknown
): ValidationResult<T> | Promise<ValidationResult<T>> {
    return schema.safeParse(data);
}
