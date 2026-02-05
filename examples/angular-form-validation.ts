/**
 * Angular Form Validation Example
 *
 * This example demonstrates how to use Wenfit Validator with Angular
 * for form validation with reactive forms.
 */

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';
import { string, number, boolean, object, type Infer } from 'wenfit-validator';
import type { ValidationErrorData } from 'wenfit-validator';

// Define the validation schema
const registrationSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: string()
    .email('Please enter a valid email address'),

  password: string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase, lowercase, and a number'
    ),

  confirmPassword: string(),

  age: number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age'),

  acceptTerms: boolean()
    .refine((val) => val, 'You must accept the terms and conditions'),
}).refine(
  (data) => data.password === data.confirmPassword,
  'Passwords must match'
);

// Infer TypeScript type from schema
type RegistrationData = Infer<typeof registrationSchema>;

@Component({
  selector: 'app-registration-form',
  template: `
    <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()" class="registration-form">
      <h2>Create Account</h2>

      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          formControlName="username"
          type="text"
          [class.error]="hasFieldError('username')"
        />
        <span *ngIf="hasFieldError('username')" class="error-message">
          {{ getFieldError('username') }}
        </span>
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          formControlName="email"
          type="email"
          [class.error]="hasFieldError('email')"
        />
        <span *ngIf="hasFieldError('email')" class="error-message">
          {{ getFieldError('email') }}
        </span>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          formControlName="password"
          type="password"
          [class.error]="hasFieldError('password')"
        />
        <span *ngIf="hasFieldError('password')" class="error-message">
          {{ getFieldError('password') }}
        </span>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          formControlName="confirmPassword"
          type="password"
          [class.error]="hasFieldError('confirmPassword')"
        />
        <span *ngIf="hasFieldError('confirmPassword')" class="error-message">
          {{ getFieldError('confirmPassword') }}
        </span>
      </div>

      <div class="form-group">
        <label for="age">Age</label>
        <input
          id="age"
          formControlName="age"
          type="number"
          [class.error]="hasFieldError('age')"
        />
        <span *ngIf="hasFieldError('age')" class="error-message">
          {{ getFieldError('age') }}
        </span>
      </div>

      <div class="form-group checkbox">
        <label>
          <input formControlName="acceptTerms" type="checkbox" />
          I accept the terms and conditions
        </label>
        <span *ngIf="hasFieldError('acceptTerms')" class="error-message">
          {{ getFieldError('acceptTerms') }}
        </span>
      </div>

      <button type="submit" [disabled]="registrationForm.invalid || isSubmitting">
        {{ isSubmitting ? 'Submitting...' : 'Register' }}
      </button>

      <div *ngIf="formErrors.length > 0" class="error-summary">
        <h4>Please fix the following errors:</h4>
        <ul>
          <li *ngFor="let error of formErrors">{{ error.message }}</li>
        </ul>
      </div>
    </form>
  `,
  styles: [`
    .registration-form {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .form-group input.error {
      border-color: #dc3545;
    }

    .error-message {
      display: block;
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }

    .error-summary {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 15px;
      margin-top: 20px;
    }

    .error-summary h4 {
      margin-top: 0;
      color: #721c24;
    }

    .error-summary ul {
      margin-bottom: 0;
    }

    button[type="submit"] {
      width: 100%;
      padding: 12px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }

    button[type="submit"]:hover {
      background-color: #0056b3;
    }

    button[type="submit"]:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class RegistrationFormComponent {
  registrationForm: FormGroup;
  formErrors: ValidationErrorData[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    // Initialize form with validators
    this.registrationForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          createSchemaValidator(string().min(3).max(20).pattern(/^[a-zA-Z0-9_]+$/))
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          createSchemaValidator(string().email())
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          createSchemaValidator(string().min(8))
        ]
      ],
      confirmPassword: ['', Validators.required],
      age: [
        18,
        [
          Validators.required,
          createSchemaValidator(number().int().min(18).max(120))
        ]
      ],
      acceptTerms: [
        false,
        [
          Validators.required,
          createSchemaValidator(boolean())
        ]
      ],
    });
  }

  /**
   * Check if a field has an error and has been touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.registrationForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get the error message for a specific field
   */
  getFieldError(fieldName: string): string | null {
    const control = this.registrationForm.get(fieldName);

    if (control?.invalid && control?.touched) {
      const errors = control.errors?.['validationErrors'];
      return errors?.[0]?.message || null;
    }

    return null;
  }

  /**
   * Handle form submission
   */
  async onSubmit() {
    // Mark all fields as touched to show errors
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      // Validate the entire form
      const validationResult = this.validationService.validateForm(
        registrationSchema,
        this.registrationForm.value
      );

      // Handle both sync and async validation results
      const result = validationResult instanceof Promise
        ? await validationResult
        : validationResult;

      if (result.success) {
        console.log('Registration successful:', result.data);

        // Send data to API
        // await this.apiService.register(result.data);

        alert('Registration successful!');

        // Clear errors and reset form
        this.formErrors = [];
        this.registrationForm.reset({
          age: 18,
          acceptTerms: false,
        });
      } else {
        // Display form-level errors
        this.formErrors = result.errors;
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred during registration');
    } finally {
      this.isSubmitting = false;
    }
  }
}

// Module setup
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [RegistrationFormComponent],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  providers: [ValidationService],
  exports: [RegistrationFormComponent],
})
export class RegistrationFormModule { }
