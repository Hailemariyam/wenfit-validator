# React Integration

Wenfit Validator provides a `useValidator` hook for seamless form validation in React applications.

## Installation

```bash
npm install wenfit-validator react
```

## Basic Usage

```tsx
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
  email: string().email(),
  password: string().min(8),
});

function LoginForm() {
  const { validate, errors, getFieldError } = useValidator({
    schema: loginSchema,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const result = await validate(data);

    if (result.success) {
      console.log('Login successful:', result.data);
      // Handle successful login
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input name="email" type="email" />
        {getFieldError('email') && (
          <span className="error">
            {getFieldError('email')?.message}
          </span>
        )}
      </div>

      <div>
        <input name="password" type="password" />
        {getFieldError('password') && (
          <span className="error">
            {getFieldError('password')?.message}
          </span>
        )}
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

## API Reference

### useValidator(options)

Creates a validator instance for your component.

**Parameters:**

```typescript
interface UseValidatorOptions<T> {
  schema: Schema<any, T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
}
```

**Returns:**

```typescript
interface UseValidatorReturn<T> {
  validate: (data: unknown) => Promise<ValidationResult<T>>;
  errors: Ref<ValidationErrorData[]>;
  isValidating: Ref<boolean>;
  getFieldError: (path: string) => ValidationErrorData | undefined;
  clearErrors: () => void;
}
```

## Validation Modes

### onSubmit (Default)

Validate only when explicitly calling `validate()`:

```tsx
const { validate } = useValidator({
  schema: mySchema,
  mode: 'onSubmit', // or omit (default)
});
```

### onChange

Validate on ev.target;
  await validate({ [name]: value });
};
```

## Field-Level Errors

Use `getFieldError()` to access errors for specific fields:

```tsx
function FormField({ name, label }: { name: string; label: string }) {
  const { getFieldError } = useValidator({ schema: mySchema });
  const error = getFieldError(name);

  return (
    <div className={error ? 'field-error' : ''}>
      <label>{label}</label>
      <input name={name} />
      {error && <span className="error">{error.message}</span>}
    </div>
  );
}
```

For nested fields, use dot notation:

```tsx
const error = getFieldError('profile.email');
const addressError = getFieldError('address.zipCode');
```

## Async Validation

The hook automatically handles async validation:

```tsx
const asyncSchema = object({
  username: string().refine(
    async (val) => {
      const isAvailable = await checkUsernameAvailable(val);
      return isAvailable;
    },
    'Username is already taken'
  ),
});

function RegistrationForm() {
  const { validate, isValidating } = useValidator({
    schema: asyncSchema,
  });

  return (
    <form>
      <input name="username" />
      {isValidating.value && (
        <span className="loading">Checking availability...</span>
      )}
      <button type="submit" disabled={isValidating.value}>
        Register
      </button>
    </form>
  );
}
```

## Controlled Components

Use with controlled components and state:

```tsx
import { useState } from 'react';

function ControlledForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { validate, errors, getFieldError } = useValidator({
    schema: loginSchema,
  });

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await validate(formData);

    if (result.success) {
      console.log('Valid data:', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.email}
        onChange={handleChange('email')}
        className={getFieldError('email') ? 'error' : ''}
      />
      {getFieldError('email') && (
        <span>{getFieldError('email')?.message}</span>
      )}

      <input
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        className={getFieldError('password') ? 'error' : ''}
      />
      {getFieldError('password') && (
        <span>{getFieldError('password')?.message}</span>
      )}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Error Display Patterns

### Inline Errors

```tsx
function InlineError({ fieldName }: { fieldName: string }) {
  const { getFieldError } = useValidator({ schema: mySchema });
  const error = getFieldError(fieldName);

  if (!error) return null;

  return (
    <div className="inline-error">
      <svg className="error-icon">...</svg>
      <span>{error.message}</span>
    </div>
  );
}
```

### Error Summary

```tsx
function ErrorSummary() {
  const { errors } = useValidator({ schema: mySchema });

  if (errors.value.length === 0) return null;

  return (
    <div className="error-summary">
      <h4>Please fix the following errors:</h4>
      <ul>
        {errors.value.map((error, i) => (
          <li key={i}>
            <strong>{error.path.join('.')}</strong>: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Toast Notifications

```tsx
import { toast } from 'your-toast-library';

function FormWithToast() {
  const { validate } = useValidator({ schema: mySchema });

  const handleSubmit = async (data: any) => {
    const result = await validate(data);

    if (!result.success) {
      result.errors.forEach(error => {
        toast.error(error.message);
      });
    } else {
      toast.success('Form submitted successfully!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Clearing Errors

Clear all errors manually:

```tsx
function MyForm() {
  const { validate, clearErrors } = useValidator({ schema: mySchema });

  const handleReset = () => {
    clearErrors();
    // Reset form...
  };

  return (
    <form>
      {/* form fields */}
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </form>
  );
}
```

## TypeScript Integration

Full type safety with inferred types:

```tsx
import { type Infer } from 'wenfit-validator';

const userSchema = object({
  username: string().min(3),
  email: string().email(),
  age: number().int().min(18),
});

type UserFormData = Infer<typeof userSchema>;

function UserForm() {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    age: 18,
  });

  const { validate } = useValidator({ schema: userSchema });

  const handleSubmit = async () => {
    const result = await validate(formData);

    if (result.success) {
      // result.data is typed as UserFormData
      const user: UserFormData = result.data;
    }
  };

  return <form>...</form>;
}
```

## Complete Example

```tsx
import { useState } from 'react';
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, number, boolean, object, type Infer } from 'wenfit-validator';

const registrationSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters'),
  email: string().email('Please enter a valid email'),
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase, lowercase, and number'
    ),
  age: number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old'),
  acceptTerms: boolean().refine(
    (val) => val,
    'You must accept the terms and conditions'
  ),
});

type RegistrationData = Infer<typeof registrationSchema>;

export function RegistrationForm() {
  const [formData, setFormData] = useState<Partial<RegistrationData>>({
    username: '',
    email: '',
    password: '',
    age: undefined,
    acceptTerms: false,
  });

  const { validate, errors, isValidating, getFieldError, clearErrors } =
    useValidator({ schema: registrationSchema });

  const handleChange = (field: keyof RegistrationData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox'
      ? e.target.checked
      : e.target.type === 'number'
      ? Number(e.target.value)
      : e.target.value;

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await validate(formData);

    if (result.success) {
      console.log('Registration successful:', result.data);
      // Submit to API
      clearErrors();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>Create Account</h2>

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={formData.username || ''}
          onChange={handleChange('username')}
          className={getFieldError('username') ? 'error' : ''}
        />
        {getFieldError('username') && (
          <span className="error-message">
            {getFieldError('username')?.message}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange('email')}
          className={getFieldError('email') ? 'error' : ''}
        />
        {getFieldError('email') && (
          <span className="error-message">
            {getFieldError('email')?.message}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password || ''}
          onChange={handleChange('password')}
          className={getFieldError('password') ? 'error' : ''}
        />
        {getFieldError('password') && (
          <span className="error-message">
            {getFieldError('password')?.message}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          value={formData.age || ''}
          onChange={handleChange('age')}
          className={getFieldError('age') ? 'error' : ''}
        />
        {getFieldError('age') && (
          <span className="error-message">
            {getFieldError('age')?.message}
          </span>
        )}
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.acceptTerms || false}
            onChange={handleChange('acceptTerms')}
          />
          I accept the terms and conditions
        </label>
        {getFieldError('acceptTerms') && (
          <span className="error-message">
            {getFieldError('acceptTerms')?.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isValidating.value}>
        {isValidating.value ? 'Validating...' : 'Register'}
      </button>

      {errors.value.length > 0 && (
        <div className="error-summary">
          <h4>Please fix the following errors:</h4>
          <ul>
            {errors.value.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
```

## Next Steps

- [Vue Integration](./vue.md) - Use with Vue
- [Error Handling](../concepts/errors.md) - Learn about error handling
- [Examples](../../examples/react-form-validation.tsx) - More examples
