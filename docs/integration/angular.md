# Angular Integration

Wenfit Validator provides a `ValidationService` and validator functions for seamless integration with Angular forms.

## Installation

```bash
npm install wenfit-validator @angular/core @angular/forms
```

## Basic Usage

### With Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
  email: string().email(),
  password: string().min(8),
});

@Component({
  selector: 'app-login',
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          formControlName="email"
          type="email"
          [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
        />
        <div *ngIf="loginForm.get('email')?.errors?.['validationErrors']" class="error-message">
          {{ loginForm.get('email')?.errors?.['validationErrors'][0].message }}
        </div>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          formControlName="password"
          type="password"
          [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
        />
        <div *ngIf="loginForm.get('password')?.errors?.['validationErrors']" class="error-message">
          {{ loginForm.get('password')?.errors?.['validationErrors'][0].message }}
        </div>
      </div>

      <button type="submit" [disabled]="loginForm.invalid">Login</button>
    </form>
  `,
  styles: [`
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
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', createSchemaValidator(string().email())],
      password: ['', createSchemaValidator(string().min(8))],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const result = this.validationService.validate(
        loginSchema,
        this.loginForm.value
      );

      if (result.success) {
        console.log('Login successful:', result.data);
        // Handle successful login
      }
    }
  }
}
```

## API Reference

### ValidationService

Injectable service for validating data against schemas.

```typescript
@Injectable({
  providedIn: 'root'
})
class ValidationService {
  validate<T>(schema: Schema<any, T>, data: unknown): ValidationResult<T>;
}
```

**Usage:**

```typescript
constructor(private validationService: ValidationService) {}

validateData() {
  const result = this.validationService.validate(mySchema, data);

  if (result.success) {
    console.log('Valid:', result.data);
  } else {
    console.log('Errors:', result.errors);
  }
}
```

### createSchemaValidator()

Creates an Angular validator function from a schema. This is a standalone function that doesn't require injecting the ValidationService.

```typescript
function createSchemaValidator(schema: Schema<any, any>): ValidatorFn;
```

**Returns:**
- `null` if validation succeeds
- `{ validationErrors: ValidationErrorData[] }` if validation fails

**Usage:**

```typescript
import { createSchemaValidator } from 'wenfit-validator/adapters/angular';

this.form = this.fb.group({
  email: ['', createSchemaValidator(string().email())],
  age: ['', createSchemaValidator(number().int().min(18))],
});
```

### createAsyncSchemaValidator()

Creates an Angular async validator function from a schema with async validation rules.

```typescript
function createAsyncSchemaValidator(schema: Schema<any, any>): AsyncValidatorFn;
```

**Usage:**

```typescript
import { createAsyncSchemaValidator } from 'wenfit-validator/adapters/angular';

const asyncSchema = string().refine(
  async (val) => await checkUnique(val),
  'Already exists'
);

this.form = this.fb.group({
  username: ['', [], [createAsyncSchemaValidator(asyncSchema)]],
});
```

### validate()

Standalone function to validate data against a schema.

```typescript
function validate<T>(
  schema: Schema<any, T>,
  data: unknown
): ValidationResult<T> | Promise<ValidationResult<T>>;
```

## Field-Level Validation

Apply validators to individual form controls:

```typescript
import { Validators } from '@angular/forms';

this.form = this.fb.group({
  username: [
    '',
    [
      Validators.required,
      createSchemaValidator(string().min(3).max(20))
    ]
  ],
  email: [
    '',
    [
      Validators.required,
      createSchemaValidator(string().email())
    ]
  ],
});
```

## Async Validators

Use async validation for database checks or API calls:

```typescript
const asyncUsernameSchema = string().refine(
  async (val) => {
    const isAvailable = await this.checkUsernameAvailable(val);
    return isAvailable;
  },
  'Username is already taken'
);

this.form = this.fb.group({
  username: [
    '',
    [], // sync validators
    [createSchemaValidator(asyncUsernameSchema)] // async validators
  ],
});
```

## Displaying Errors

### Template-Driven Approach

```typescript
@Component({
  template: `
    <form [formGroup]="form">
      <input formControlName="email" />

      <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
        <div *ngFor="let error of getFieldErrors('email')">
          {{ error.message }}
        </div>
      </div>
    </form>
  `
})
export class MyComponent {
  getFieldErrors(fieldName: string): ValidationErrorData[] {
    const control = this.form.get(fieldName);
    return control?.errors?.['validationErrors'] || [];
  }
}
```

### Error Helper Method

```typescript
export class FormComponent {
  form: FormGroup;

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);

    if (control?.invalid && control?.touched) {
      const errors = control.errors?.['validationErrors'];
      return errors?.[0]?.message || null;
    }

    return null;
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
```

Usage in template:

```html
<input formControlName="email" [class.error]="hasFieldError('email')" />
<span *ngIf="hasFieldError('email')" class="error-message">
  {{ getFieldError('email') }}
</span>
```

## Form-Level Validation

Validate the entire form at once:

```typescript
const registrationSchema = object({
  username: string().min(3),
  email: string().email(),
  password: string().min(8),
  confirmPassword: string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  'Passwords must match'
);

@Component({
  selector: 'app-registration',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- form fields -->

      <div *ngIf="formErrors.length > 0" class="error-summary">
        <h4>Please fix the following errors:</h4>
        <ul>
          <li *ngFor="let error of formErrors">{{ error.message }}</li>
        </ul>
      </div>

      <button type="submit">Register</button>
    </form>
  `
})
export class RegistrationComponent {
  form: FormGroup;
  formErrors: ValidationErrorData[] = [];

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    this.form = this.fb.group({
      username: [''],
      email: [''],
      password: [''],
      confirmPassword: [''],
    });
  }

  onSubmit() {
    const result = this.validationService.validate(
      registrationSchema,
      this.form.value
    );

    if (result.success) {
      console.log('Valid:', result.data);
      this.formErrors = [];
    } else {
      this.formErrors = result.errors;
    }
  }
}
```

## TypeScript Integration

Full type safety with inferred types:

```typescript
import { type Infer } from 'wenfit-validator';

const userSchema = object({
  username: string().min(3),
  email: string().email(),
  age: number().int().min(18),
});

type UserFormData = Infer<typeof userSchema>;

@Component({
  selector: 'app-user-form',
  template: `...`
})
export class UserFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    this.form = this.fb.group({
      username: [''],
      email: [''],
      age: [18],
    });
  }

  onSubmit() {
    const result = this.validationService.validate(
      userSchema,
      this.form.value
    );

    if (result.success) {
      // result.data is typed as UserFormData
      const userData: UserFormData = result.data;
      console.log(userData.username); // TypeScript knows this is a string
    }
  }
}
```

## Custom Error Display Component

Create a reusable error display component:

```typescript
// field-error.component.ts
import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  template: `
    <div *ngIf="shouldShowError()" class="error-message">
      {{ getErrorMessage() }}
    </div>
  `,
  styles: [`
    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }
  `]
})
export class FieldErrorComponent {
  @Input() control: FormControl | null = null;

  shouldShowError(): boolean {
    return !!(this.control?.invalid && this.control?.touched);
  }

  getErrorMessage(): string {
    const errors = this.control?.errors?.['validationErrors'];
    return errors?.[0]?.message || 'Invalid input';
  }
}
```

Usage:

```html
<input formControlName="email" />
<app-field-error [control]="form.get('email')"></app-field-error>
```

## Complete Example

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidationService, createSchemaValidator } from 'wenfit-validator/adapters/angular';
import { string, number, boolean, object, type Infer } from 'wenfit-validator';

const registrationSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: string().email('Please enter a valid email address'),
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: string(),
  age: number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old'),
  acceptTerms: boolean().refine(
    (val) => val,
    'You must accept the terms and conditions'
  ),
}).refine(
  (data) => data.password === data.confirmPassword,
  'Passwords must match'
);

type RegistrationData = Infer<typeof registrationSchema>;

@Component({
  selector: 'app-registration',
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
export class RegistrationComponent {
  registrationForm: FormGroup;
  formErrors: ValidationErrorData[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    this.registrationForm = this.fb.group({
      username: ['', createSchemaValidator(string().min(3).max(20))],
      email: ['', createSchemaValidator(string().email())],
      password: ['', createSchemaValidator(string().min(8))],
      confirmPassword: [''],
      age: [18, createSchemaValidator(number().int().min(18))],
      acceptTerms: [false, createSchemaValidator(boolean())],
    });
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.registrationForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(fieldName: string): string | null {
    const control = this.registrationForm.get(fieldName);

    if (control?.invalid && control?.touched) {
      const errors = control.errors?.['validationErrors'];
      return errors?.[0]?.message || null;
    }

    return null;
  }

  async onSubmit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const result = this.validationService.validate(
        registrationSchema,
        this.registrationForm.value
      );

      if (result.success) {
        console.log('Registration successful:', result.data);
        // Submit to API
        this.formErrors = [];
        this.registrationForm.reset();
      } else {
        this.formErrors = result.errors;
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
```

## Module Setup

Don't forget to provide the ValidationService in your module:

```typescript
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ValidationService } from 'wenfit-validator/adapters/angular';

@NgModule({
  imports: [ReactiveFormsModule],
  providers: [ValidationService],
  declarations: [/* your components */],
})
export class AppModule {}
```

## Next Steps

- [Express Integration](./express.md) - Validate API requests
- [Error Handling](../concepts/errors.md) - Learn about error handling
- [Examples](../../examples/angular-form-validation.ts) - More examples
