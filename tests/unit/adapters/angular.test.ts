// Unit tests for Angular adapter

import { describe, test, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../../src/adapters/angular.js';
import { string, number, object, array } from '../../../src/index.js';
import { firstValueFrom } from 'rxjs';

// Mock Angular forms classes for testing
class MockAbstractControl {
    value: any;
    errors: any = null;

    constructor(value: any) {
        this.value = value;
    }
}

class FormControl extends MockAbstractControl {
    constructor(value: any, validators?: any, asyncValidators?: any) {
        super(value);
        if (validators) {
            this.errors = validators(this);
        }
        if (asyncValidators) {
            asyncValidators(this).subscribe((errors: any) => {
                this.errors = errors;
            });
        }
    }
}

class FormGroup {
    controls: Record<string, FormControl> = {};
    valid: boolean = true;

    constructor(controls: Record<string, any>) {
        this.controls = controls;
        this.updateValidity();
    }

    get(name: string): FormControl | null {
        return this.controls[name] || null;
    }

    patchValue(value: Record<string, any>): void {
        for (const key in value) {
            if (this.controls[key]) {
                this.controls[key].value = value[key];
            }
        }
        this.updateValidity();
    }

    private updateValidity(): void {
        this.valid = Object.values(this.controls).every(control => !control.errors);
    }
}

class FormBuilder {
    group(controls: Record<string, any[]>): FormGroup {
        const formControls: Record<string, FormControl> = {};
        for (const key in controls) {
            const [value, validator] = controls[key];
            formControls[key] = new FormControl(value, validator);
        }
        return new FormGroup(formControls);
    }
}

describe('Angular Adapter - ValidationService', () => {
    let validationService: ValidationService;

    beforeEach(() => {
        validationService = new ValidationService();
    });

    describe('Integration with Angular reactive forms', () => {
        test('should create synchronous validator for simple schema', () => {
            const schema = string().min(5);
            const validator = validationService.createValidator(schema);

            const control = new FormControl('abc');
            const errors = validator(control as any);

            expect(errors).not.toBeNull();
            expect(errors).toHaveProperty('validation');
        });

        test('should return null for valid input', () => {
            const schema = string().min(5);
            const validator = validationService.createValidator(schema);

            const control = new FormControl('valid string');
            const errors = validator(control as any);

            expect(errors).toBeNull();
        });

        test('should validate email format', () => {
            const schema = string().email();
            const validator = validationService.createValidator(schema);

            const invalidControl = new FormControl('invalid-email');
            const invalidErrors = validator(invalidControl as any);
            expect(invalidErrors).not.toBeNull();

            const validControl = new FormControl('test@example.com');
            const validErrors = validator(validControl as any);
            expect(validErrors).toBeNull();
        });

        test('should validate number constraints', () => {
            const schema = number().min(18);
            const validator = validationService.createValidator(schema);

            const invalidControl = new FormControl(15);
            const invalidErrors = validator(invalidControl as any);
            expect(invalidErrors).not.toBeNull();

            const validControl = new FormControl(25);
            const validErrors = validator(validControl as any);
            expect(validErrors).toBeNull();
        });

        test('should validate object schemas', () => {
            const schema = object({
                email: string().email(),
                age: number().min(18),
            });
            const validator = validationService.createValidator(schema);

            const invalidControl = new FormControl({
                email: 'invalid',
                age: 15,
            });
            const invalidErrors = validator(invalidControl as any);
            expect(invalidErrors).not.toBeNull();

            const validControl = new FormControl({
                email: 'test@example.com',
                age: 25,
            });
            const validErrors = validator(validControl as any);
            expect(validErrors).toBeNull();
        });
    });

    describe('Async validator support', () => {
        test.skip('should create async validator for schema with async rules', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.includes('valid');
                },
                'Must contain valid'
            );

            const asyncValidator = validationService.createAsyncValidator(schema);
            const control = new FormControl('invalid');

            const errors = await firstValueFrom(asyncValidator(control as any));
            expect(errors).not.toBeNull();
            expect(errors?.['validation']).toBeDefined();
        });

        test('should return null for valid async validation', async () => {
            const schema = string().refine(
                async (val) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return val.length > 5;
                },
                'Too short'
            );

            const asyncValidator = validationService.createAsyncValidator(schema);
            const control = new FormControl('valid string');

            const errors = await firstValueFrom(asyncValidator(control as any));
            expect(errors).toBeNull();
        });
    });

    describe('Form validation helper', () => {
        test('should validate entire form with validateForm', () => {
            const schema = object({
                email: string().email(),
                age: number().min(18),
            });

            const formValue = {
                email: 'test@example.com',
                age: 25,
            };

            const result = validationService.validateForm(schema, formValue);

            if (result instanceof Promise) {
                return result.then(r => {
                    expect(r.success).toBe(true);
                });
            } else {
                expect(result.success).toBe(true);
            }
        });

        test('should return errors for invalid form', () => {
            const schema = object({
                email: string().email(),
                age: number().min(18),
            });

            const formValue = {
                email: 'invalid',
                age: 15,
            };

            const result = validationService.validateForm(schema, formValue);

            if (result instanceof Promise) {
                return result.then(r => {
                    expect(r.success).toBe(false);
                    if (!r.success) {
                        expect(r.errors.length).toBeGreaterThan(0);
                    }
                });
            } else {
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            }
        });
    });

    describe('Error message extraction', () => {
        test.skip('should extract error message from control', () => {
            const schema = string().email();
            const validator = validationService.createValidator(schema);

            const control = new FormControl('invalid');
            validator(control as any);

            const errorMessage = validationService.getErrorMessage(control as any);
            expect(errorMessage).toBeDefined();
            expect(typeof errorMessage).toBe('string');
        });

        test('should return null when no errors', () => {
            const schema = string().email();
            const validator = validationService.createValidator(schema);

            const control = new FormControl('test@example.com');
            validator(control as any);

            const errorMessage = validationService.getErrorMessage(control as any);
            expect(errorMessage).toBeNull();
        });
    });

    describe('Error format conversion', () => {
        test('should convert Wenfit errors to Angular format', () => {
            const schema = string().min(5).email();
            const validator = validationService.createValidator(schema);

            const control = new FormControl('abc');
            const errors = validator(control as any);

            expect(errors).not.toBeNull();
            expect(errors?.['validation']).toBeDefined();
            expect(errors?.['validation'].errors).toBeInstanceOf(Array);
        });

        test('should include error codes in Angular errors', () => {
            const schema = string().email();
            const validator = validationService.createValidator(schema);

            const control = new FormControl('invalid');
            const errors = validator(control as any);

            expect(errors).not.toBeNull();
            const validationErrors = errors?.['validation'].errors;
            expect(validationErrors[0].code).toBe('string.email');
        });
    });
});
